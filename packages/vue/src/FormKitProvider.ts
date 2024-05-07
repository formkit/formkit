import type { SetupContext } from 'vue'
import { defineComponent } from 'vue'
import type { FormKitOptions } from '@formkit/core'
import { createConfig } from '@formkit/core'
import { optionsSymbol, configSymbol } from './plugin'
import { provide } from 'vue'
import { h } from 'vue'

/**
 * A composable to provide a given configuration to all children.
 * @param config - A FormKit configuration object or a function
 */
export function useConfig(
  config?: FormKitOptions | ((...args: any[]) => FormKitOptions)
) {
  const options = Object.assign(
    {
      alias: 'FormKit',
      schemaAlias: 'FormKitSchema',
    },
    typeof config === 'function' ? config() : config
  )
  /**
   * The root configuration options.
   */
  const rootConfig = createConfig(options.config || {})
  /**
   * We dont want to explicitly provide any "config" options, only a root
   * config option — so here we override the existing config options.
   */
  options.config = { rootConfig }
  /**
   * Provide the config to children.
   */
  provide(optionsSymbol, options)
  /**
   * Provide the root config to the children.
   */
  provide(configSymbol, rootConfig)
  /**
   * Register the FormKit component globally.
   */
  if (typeof window !== 'undefined') {
    globalThis.__FORMKIT_CONFIGS__ = (
      globalThis.__FORMKIT_CONFIGS__ || []
    ).concat([rootConfig])
  }
}

export interface FormKitProviderProps {
  config?: FormKitOptions | ((...args: any[]) => FormKitOptions)
}

export interface ConfigLoaderProps {
  defaultConfig?: boolean
  configFile?: string
}

/**
 * The FormKitProvider component provides the FormKit config to the children.
 *
 * @public
 */
export const FormKitProvider = /* #__PURE__ */ defineComponent(
  function FormKitProvider<
    P extends FormKitProviderProps,
    S extends { default: FormKitOptions }
  >(props: P, { slots, attrs }: SetupContext<S>) {
    const options: FormKitOptions = {}
    if (props.config) {
      useConfig(props.config)
    }

    return () =>
      slots.default
        ? slots.default(options).map((vnode) => {
            return h(vnode, {
              ...attrs,
              ...vnode.props,
            })
          })
        : null
  },
  { props: ['config'], name: 'FormKitProvider', inheritAttrs: false }
)
