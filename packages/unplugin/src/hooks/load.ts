import type { UnpluginOptions } from 'unplugin'
import type { ResolvedOptions } from '../types'
import { FORMKIT_CONFIG_PREFIX } from '../index'
import { getConfigProperty } from '../utils/config'
import { consola } from 'consola'
import { isIdentifier } from '@babel/types'
import { extract } from '../utils/ast'
import type { NodePath } from '@babel/traverse'
import type { Node } from '@babel/types'

/**
 * The load hook for unplugin.
 * @returns
 */
export function createLoad(
  opts: ResolvedOptions
): Exclude<UnpluginOptions['load'], undefined> {
  return async function load(id) {
    if (id.startsWith('\0' + FORMKIT_CONFIG_PREFIX)) {
      const [plugin, identifier] = id
        .substring(FORMKIT_CONFIG_PREFIX.length + 1)
        .split(':')
      if (plugin === 'inputs') {
        return await createVirtualInputConfig(opts, identifier)
      }
      if (plugin === 'library') {
        return `const library = () => {};
        library.library = () => {}
        export { library }`
      }
    }
    return null
  }
}

export async function createVirtualInputConfig(
  opts: ResolvedOptions,
  inputName: string
): Promise<string> {
  if (opts.configAst) {
    const inputs = getConfigProperty(opts, 'inputs')
    if (inputs && inputs.node.value.type !== 'ObjectExpression') {
      consola.warn(
        '[FormKit de-opt] cannot statically analyze DefineConfigOptions.inputs. Please use an inline object literal.'
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
        return opts.generate(extract(inputPropertyValue)).code
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
  return `import { ${inputName} } from '@formkit/inputs';
const library = () => {};
library.library = (node) => node.define(${inputName});
export { library };`
}
