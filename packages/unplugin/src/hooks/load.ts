import type {
  TransformResult,
  UnpluginBuildContext,
  UnpluginContext,
  UnpluginOptions,
} from 'unplugin'
import type { ResolvedOptions } from '../types'
import { FORMKIT_CONFIG_PREFIX } from '../index'
import { createConfigAst, getConfigProperty } from '../utils/config'
import { consola } from 'consola'
import { isIdentifier } from '@babel/types'
import { extract } from '../utils/ast'
import type { NodePath } from '@babel/traverse'
import type { Node } from '@babel/types'
import tcjs from '@babel/template'

const t: typeof tcjs = ('default' in tcjs ? tcjs.default : tcjs) as typeof tcjs

const previouslyLoaded: Record<string, number> = {}
let totalReloads = 0

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
      if (plugin === 'inputs') {
        return await createVirtualInputConfig(opts, identifier)
      }
      if (plugin === 'library') {
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
    }
    return null
  }
}

/**
 * Tracks that this is a reload of the configuration.
 * @param this - The unplugin context
 * @param opts - The resolved options
 * @param id - The id of the module being reloaded
 */
function trackReload(
  this: UnpluginContext & UnpluginBuildContext,
  opts: ResolvedOptions,
  id: string
) {
  // Track the number of times each module has been reloaded. We’ll need to
  // re-parse the config’s AST in case it has changed.
  previouslyLoaded[id] = (previouslyLoaded[id] || 0) + 1
  if (previouslyLoaded[id] > totalReloads) totalReloads = previouslyLoaded[id]

  // Make the configuration a watched file.
  if (opts.configPath) {
    this.addWatchFile(opts.configPath)
    if (opts.configParseCount < totalReloads) {
      consola.info('Reloading formkit.config.ts file')
      opts.configAst = createConfigAst(opts.parse, opts.configPath)
      opts.configParseCount = totalReloads
    }
  }
}

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
        const library = t.statements.ast`const library = () => {}
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
