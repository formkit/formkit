import {
  FormKitOptions,
  FormKitNode,
  FormKitConfig,
  getNode,
  createConfig,
  setErrors,
  clearErrors,
  submitForm,
  reset,
} from '@formkit/core'
import type { App, Plugin, InjectionKey } from 'vue'
import FormKit from './FormKit'
import FormKitSchema from './FormKitSchema'

/**
 * The global instance of the FormKit plugin.
 *
 * @public
 */
export interface FormKitVuePlugin {
  get: (id: string) => FormKitNode | undefined
  setLocale: (locale: string) => void
  setErrors: (
    formId: string,
    errors: string[] | Record<string, string | string[]>,
    inputErrors?: string[] | Record<string, string | string[]>
  ) => void
  clearErrors: (formId: string) => void
  submit: (formId: string) => void
  reset: (formId: string, resetTo?: unknown) => void
}

/**
 * The Create a new instance of the FormKit plugin for Vue.
 *
 * @param app - A Vue application
 * @param config - FormKit Vue plugin configuration options
 *
 * @internal
 */
function createPlugin(
  app: App<any>,
  options: FormKitOptions & Record<string, any>
): FormKitVuePlugin {
  app
    .component(options.alias || 'FormKit', FormKit as any)
    .component(options.schemaAlias || 'FormKitSchema', FormKitSchema)
  return {
    get: getNode,
    setLocale: (locale: string) => {
      if (options.config?.rootConfig) {
        options.config.rootConfig.locale = locale
      }
    },
    clearErrors,
    setErrors,
    submit: submitForm,
    reset,
  }
}

/**
 * The symbol key for accessing the FormKit node options.
 *
 * @public
 */
export const optionsSymbol: InjectionKey<FormKitOptions> =
  Symbol.for('FormKitOptions')

/**
 * The symbol key for accessing FormKit root configuration.
 *
 * @public
 */
export const configSymbol: InjectionKey<FormKitConfig> =
  Symbol.for('FormKitConfig')

/**
 * Create the FormKit plugin.
 *
 * @public
 */
export const plugin: Plugin = {
  install(
    app,
    _options: FormKitOptions | ((...args: any[]) => FormKitOptions)
  ): void {
    /**
     * Extend the default configuration options.
     */
    const options: FormKitOptions = Object.assign(
      {
        alias: 'FormKit',
        schemaAlias: 'FormKitSchema',
      },
      typeof _options === 'function' ? _options() : _options
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
     * Register the global $formkit plugin property.
     */
    app.config.globalProperties.$formkit = createPlugin(app, options)
    /**
     * Provide the config to the application for injection.
     */
    app.provide(optionsSymbol, options)
    /**
     * Provide the root config to the application.
     */
    app.provide(configSymbol, rootConfig as FormKitConfig)
  },
}
