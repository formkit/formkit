import { defineComponent, SetupContext } from 'vue'
import { FormKitOptions, createConfig } from '@formkit/core'
import { optionsSymbol, configSymbol } from './plugin'
import { provide, inject } from 'vue'
import { h } from 'vue'
import { Suspense } from 'vue'

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
 */
export const FormKitProvider = defineComponent(
  function FormKitProvider<
    P extends FormKitProviderProps,
    S extends { default: FormKitOptions }
  >(props: P, { slots }: SetupContext<S>) {
    const options: FormKitOptions = {}
    if (props.config) {
      useConfig(props.config)
    }

    return () => (slots.default ? slots.default(options) : null)
  },
  { props: ['config'], name: 'FormKitProvider' }
)

/**
 * The FormKitConfigLoader is an async component (meaning it needs a parent or
 * grandparent Suspense component to render) that loads the FormKit config and
 * provides it to the children.
 */
export const FormKitConfigLoader = defineComponent(
  async function FormKitConfigLoader(props: ConfigLoaderProps, context) {
    let config = {}
    if (props.configFile) {
      config = await import(props.configFile)
    }
    const useDefaultConfig = props.defaultConfig ?? true
    if (useDefaultConfig) {
      const { defaultConfig } = await import('@formkit/vue')
      config = defaultConfig(config)
    }
    return () => h(FormKitProvider, { config }, context.slots)
  },
  {
    props: ['defaultConfig', 'configFile'],
  }
)

/**
 * The FormKitLazyProvider component performs 2 HOC functions:
 *
 * 1. It checks if a FormKit config has already been provided, if it has it will
 *   render the children immediately.
 * 2. If a config has not been provided, it will render a Suspense component
 *    which will render the children once the config has been loaded by using
 *    the FormKitConfigLoader component.
 */
export const FormKitLazyProvider = defineComponent(function FormKitLazyProvider(
  props: ConfigLoaderProps,
  context
) {
  const config = inject(optionsSymbol, null)
  return config
    ? // If there is already a config provided, render the children immediately.
      () => (context.slots?.default ? context.slots.default() : null)
    : // If there is no config provided, render a Suspense component that will
      // render the children once the config has been loaded.
      () =>
        h(Suspense, null, {
          ...context.slots,
          default: () => h(FormKitConfigLoader, props, context.slots),
        })
})
