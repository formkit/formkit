import type { TransformResult, UnpluginOptions } from 'unplugin'
import type { ResolvedOptions } from '../types'
import { FORMKIT_CONFIG_PREFIX } from '../index'
import { getConfigProperty } from '../utils/config'
import { trackReload } from '../utils/config'
import { consola } from 'consola'
import { isIdentifier } from '@babel/types'
import { extract } from '../utils/ast'
import type { NodePath } from '@babel/traverse'
import type { Node } from '@babel/types'
import tcjs from '@babel/template'

const t: typeof tcjs = ('default' in tcjs ? tcjs.default : tcjs) as typeof tcjs

/**
 * The load hook for unplugin.
 * @returns
 */
export function createLoad(
  opts: ResolvedOptions
): Exclude<UnpluginOptions['load'], undefined> {
  return async function load(id) {
    if (id.startsWith('\0' + FORMKIT_CONFIG_PREFIX)) {
      trackReload.call(this, opts, id)
      const [plugin, identifier] = id
        .substring(FORMKIT_CONFIG_PREFIX.length + 1)
        .split(':')

      switch (plugin) {
        case 'inputs':
          return await createVirtualInputConfig(opts, identifier)

        case 'library':
          return await createDeoptimizedLibrary(opts)

        case 'validation':
          return await createValidationConfig()

        case 'rules':
          return await createVirtualRuleConfig(opts, identifier)
      }
    }
    return null
  }
}

/**
 * Create a validation configuration for the given options.
 * @param opts - Resolved options
 */
function createValidationConfig(): TransformResult {
  return `import { createValidationPlugin } from '@formkit/validation'
const validation = createValidationPlugin({})
export { validation }
`
}

function createVirtualRuleConfig(
  opts: ResolvedOptions,
  ruleName: string
): TransformResult {
  return opts.generate(
    t.program.ast`export { ${ruleName} } from '@formkit/rules'`
  )
}

/**
 * Create a library that includes all core inputs and any additional inputs.
 * It is not ideal for this to be used, but when the source code uses dynamic
 * references to input types we have no choice but to resolve them at runtime.
 * @param opts - Resolved options
 * @returns
 */
function createDeoptimizedLibrary(opts: ResolvedOptions): TransformResult {
  const definedInputs = getConfigProperty(opts, 'inputs')
  const extracted = definedInputs
    ? extract(definedInputs.get('value'), false)
    : t.ast`const __extracted__ = {}`
  return opts.generate(t.program.ast`
    import { createLibraryPlugin, inputs } from '@formkit/inputs'
    ${extracted}
    const library = createLibraryPlugin({
      ...inputs,
      ...__extracted__,
    })
    export { library }
  `)
}

/**
 * Creates a "library" for a virtual input configuration. This creates a single
 * library that can be only imports the code necessary to boot that single
 * input.
 * @param opts - Resolved options
 * @param inputName - The name of the input to create a virtual config for.
 * @returns
 */
export async function createVirtualInputConfig(
  opts: ResolvedOptions,
  inputName: string
): Promise<TransformResult> {
  if (opts.configAst) {
    const inputs = getConfigProperty(opts, 'inputs')
    if (inputs && inputs.node.value.type !== 'ObjectExpression') {
      consola.warn(
        "[FormKit de-opt] cannot statically analyze DefineConfigOptions['inputs']. Please use an inline object literal."
      )
    } else if (inputs?.node.value.type === 'ObjectExpression') {
      let inputPropertyValue: NodePath<Node> | undefined
      inputs.get('value').traverse({
        ObjectProperty(path) {
          if (
            path.parentPath.parentPath === inputs &&
            isIdentifier(path.node.key, { name: inputName })
          ) {
            inputPropertyValue = path.get('value')
            path.stop()
          }
        },
      })
      if (inputPropertyValue) {
        const inputDefinition = extract(inputPropertyValue)
        const library = t.statements.ast`const library = () => {
          return false
        }
        library.library = (node) => node.define(__extracted__);
        export { library };`
        opts.traverse(inputDefinition, {
          Program(path) {
            path.pushContainer('body', library)
          },
        })
        return opts.generate(inputDefinition)
      }
    }
  }

  // The configuration does not define the given input, so we can attempt to
  // directly import it from the @formkit/inputs package.
  const { inputs } = await import('@formkit/inputs')
  if (!(inputName in inputs)) {
    console.error(`Unknown input: "${inputName}"`)
    throw new Error(
      `Input ${inputName} is not a registered input or an available input in @formkit/inputs.`
    )
  }
  return opts.generate(t.program
    .ast`import { ${inputName} } from '@formkit/inputs';
  const library = () => {};
  library.library = (node) => node.define(${inputName});
  export { library };`)
}
