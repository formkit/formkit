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
  key?: string | number
  control: string
  debounce?: number
  beforeSave?: (payload: any) => any
  beforeLoad?: (payload: any) => any
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
  localStorageOptions?: LocalStorageOptions
): FormKitPlugin {
  const localStoragePlugin = (node: FormKitNode) => {
    if (node.props.type !== 'form') return

    const shouldUseLocalStorage = (controlNode: FormKitNode | undefined) => {
      let controlFieldValue = true
      if (controlNode) {
        controlFieldValue = controlNode.value === true
      }
      return undefine(node.props.useLocalStorage) && controlFieldValue
    }

    node.on('created', async () => {
      node.addProps(['useLocalStorage'])
      await node.settled

      // if the user provided a control field, then we need to listen for changes
      // and use it to determine whether or not to use local storage
      const controlField = localStorageOptions?.control ?? undefined
      let controlNode: FormKitNode | undefined
      if (typeof controlField === 'string') {
        const controlNode = node.at(controlField)
        if (controlNode) {
          controlNode.on('commit', () => {
            useLocalStorage = shouldUseLocalStorage(controlNode)
            if (!useLocalStorage) {
              localStorage.removeItem(storageKey)
            }
          })
        }
      }

      let useLocalStorage = shouldUseLocalStorage(controlNode)
      let saveTimeout: ReturnType<typeof setTimeout> | number = 0
      const debounce =
        typeof localStorageOptions?.debounce === 'number'
          ? localStorageOptions.debounce
          : 200
      const prefix = localStorageOptions?.prefix ?? 'formkit'
      const maxAge = localStorageOptions?.maxAge ?? 3600000 // 1 hour
      const key = localStorageOptions?.key ? `-${localStorageOptions.key}` : '' // for scoping to a specific user
      const storageKey = `${prefix}${key}-${node.name}`

      const loadValue = async () => {
        const value = localStorage.getItem(storageKey)
        if (!value) return
        const loadValue = JSON.parse(value)
        if (typeof localStorageOptions?.beforeLoad === 'function') {
          node.props.disabled = true
          try {
            loadValue.data = await localStorageOptions.beforeLoad(
              loadValue.data
            )
          } catch (error) {
            console.error(error)
          }
          node.props.disabled = false
        }
        if (!loadValue || typeof loadValue.data !== 'object') return
        if (loadValue.maxAge > Date.now()) {
          node.input(loadValue.data)
        } else {
          localStorage.removeItem(storageKey)
        }
      }

      const saveValue = async (payload: unknown) => {
        let savePayload = payload
        if (typeof localStorageOptions?.beforeSave === 'function') {
          try {
            savePayload = await localStorageOptions.beforeSave(payload)
          } catch (error) {
            console.error(error)
          }
        }

        if (!savePayload) return

        localStorage.setItem(
          storageKey,
          JSON.stringify({
            maxAge: Date.now() + maxAge,
            data: savePayload,
          })
        )
      }

      node.on('commit', ({ payload }) => {
        if (!useLocalStorage) return
        // debounce the save to local storage
        clearTimeout(saveTimeout)
        saveTimeout = setTimeout(async () => {
          saveValue(payload)
        }, debounce)
      })

      node.on('prop:useLocalStorage', () => {
        useLocalStorage = shouldUseLocalStorage(controlNode)
        if (!useLocalStorage) {
          localStorage.removeItem(storageKey)
        }
      })

      node.hook.submit((payload, next) => {
        localStorage.removeItem(storageKey)
        return next(payload)
      })

      await loadValue()
    })
  }
  return localStoragePlugin
}
