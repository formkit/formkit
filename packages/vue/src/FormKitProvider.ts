import { defineComponent, SetupContext } from 'vue'
import { FormKitOptions, createConfig } from '@formkit/core'
import { optionsSymbol, configSymbol } from './plugin'
import { provide } from 'vue'

export interface FormKitProviderProps {
  config?: FormKitOptions | ((...args: any[]) => FormKitOptions)
}

export const FormKitProvider = defineComponent(
  function setup<
    P extends FormKitProviderProps,
    S extends { default: FormKitOptions }
  >(props: P, { slots }: SetupContext<S>) {
    const options: FormKitOptions = Object.assign(
      {
        alias: 'FormKit',
        schemaAlias: 'FormKitSchema',
      },
      typeof props.config === 'function' ? props.config() : props.config
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

    return () => (slots.default ? slots.default(options) : null)
  },
  { props: ['config'] }
)
