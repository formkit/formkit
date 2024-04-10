import type { FormKitNode, FormKitPlugin } from '@formkit/core'
import { undefine } from '@formkit/utils'

/**
 * The options to be passed to {@link createLocalStoragePlugin | createLocalStoragePlugin}
 *
 * @param prefix - The prefix to use for the local storage key
 * @param key - The key to use for the local storage entry, useful for scoping data per user
 * @param control - The form control to use enable or disable saving to localStorage. Must return a boolean value.
 * @param maxAge - The maximum age of the local storage entry in milliseconds
 * @param debounce - The debounce time in milliseconds to use when saving to localStorage
 * @param beforeSave - A function to call for modifying data before saving to localStorage
 * @param beforeLoad - A function to call for modifying data before loading from localStorage
 *
 * @public
 */
export interface LocalStorageOptions {
  prefix?: string
  key?: string | number
  control?: string
  maxAge?: number
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
    // only apply if internal FormKit type is 'group'. This applies
    // to 'form' and 'group' inputs — as well as any add-on inputs
    // registered of FormKit type 'group' (eg. 'multi-step').
    if (node.type !== 'group') return

    // enable SSR support
    if (typeof window === "undefined") return

    let cachedLocalStorageData: string | null = ''

    const shouldUseLocalStorage = (controlNode: FormKitNode | undefined) => {
      let controlFieldValue = true
      if (controlNode) {
        controlFieldValue = controlNode.value === true
      }
      return undefine(node.props.useLocalStorage) && controlFieldValue
    }

    node.on('created', async () => {
      await node.settled

      node.addProps(['useLocalStorage'])
      node.extend('restoreCache', {
        get: (node) => async () => {
          if (!cachedLocalStorageData) return
          await node.settled
          loadValue(cachedLocalStorageData)
        },
        set: false,
      })

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

      const loadValue = async (forceValue?: string) => {
        const value = forceValue || localStorage.getItem(storageKey)
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
          node.input(loadValue.data, false)
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
        // cache data in case the user wants to restore
        cachedLocalStorageData = localStorage.getItem(storageKey)
        // remove from the localStorage cache
        localStorage.removeItem(storageKey)
        return next(payload)
      })

      await loadValue()
    })
  }
  return localStoragePlugin
}
