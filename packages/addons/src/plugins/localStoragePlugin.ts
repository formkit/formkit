import { FormKitNode, FormKitPlugin } from '@formkit/core'
import { undefine } from '@formkit/utils'

/**
 * The options to be passed to {@link createLocalStoragePlugin | createLocalStoragePlugin}
 *
 * @public
 */
export interface LocalStorageOptions {
  prefix?: string
  maxAge?: number
}

/**
 * Creates a new save-to-local-storage plugin.
 *
 * @param LocalStorageOptions - The options of {@link LocalStorageOptions | LocalStorageOptions} to pass to the plugin
 *
 * @returns A {@link @formkit/core#FormKitPlugin | FormKitPlugin}
 *
 * @public
 */
export function createLocalStoragePlugin(
  LocalStorageOptions?: LocalStorageOptions
): FormKitPlugin {
  const localStoragePlugin = (node: FormKitNode) => {
    if (!['form','multi-step'].includes(node.props.type)) return
    node.addProps(['useLocalStorage'])

    node.on('created', () => {
      const useLocalStorage = undefine(node.props.useLocalStorage)
      if (!useLocalStorage) return

      const prefix = LocalStorageOptions?.prefix ?? 'formkit'
      const maxAge = LocalStorageOptions?.maxAge ?? 3600000 // 1 hour
      const key = `${prefix}-${node.name}`
      const value = localStorage.getItem(key)

      if (value) {
        const localStorageValue = JSON.parse(value)
        if (localStorageValue.maxAge > Date.now()) {
          node.input(localStorageValue.data)
        } else {
          localStorage.removeItem(key)
        }
      }

      node.on('commit', ({ payload }) => {
        localStorage.setItem(
          key,
          JSON.stringify({
            maxAge: Date.now() + maxAge,
            data: payload,
          })
        )
      })

      node.hook.submit((payload, next) => {
        localStorage.removeItem(key)
        return next(payload)
      })
    })
  }
  return localStoragePlugin
}
