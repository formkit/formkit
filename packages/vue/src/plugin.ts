import { FormKitOptions } from '@formkit/core'
import { FormKitLibrary } from '@formkit/inputs'
import { App, Plugin, InjectionKey } from 'vue'
import FormKit from './FormKit'

/**
 * Augment Vue’s globalProperties.
 */
declare module '@vue/runtime-core' {
  export interface ComponentCustomProperties {
    $formkit: FormKitVuePlugin
  }
}

/**
 * Configuration options for the FormKit Vue plugin.
 * @public
 */
export interface FormKitVueConfig {
  alias: string
  library: FormKitLibrary
  nodeOptions: FormKitOptions
}

/**
 * The global instance of the FormKit plugin.
 */
export interface FormKitVuePlugin {
  library: FormKitLibrary
}

/**
 * The Create a new instance of the FormKit plugin for Vue.
 * @param app - A Vue application
 * @param config - FormKit Vue plugin configuration options
 */
function createPlugin(
  app: App<any>,
  config: FormKitVueConfig
): FormKitVuePlugin {
  app.component(config.alias, FormKit)
  return {
    library: config.library,
  }
}

/**
 * These are the absolute minimum configuration options
 * to boot up FormKit.
 */
export const minConfig: FormKitVueConfig = {
  alias: 'FormKit',
  library: {},
  nodeOptions: {},
}

/**
 * The symbol key for accessing the formkit config.
 */
export const configSymbol: InjectionKey<FormKitVueConfig> = Symbol(
  'FormKitConfig'
)

/**
 * Create the FormKit plugin.
 */
const plugin: Plugin = {
  install(app, options): void {
    /**
     * Extend the default configuration options.
     */
    const config = Object.assign({}, minConfig, options)

    /**
     * Register the global $formkit plugin property.
     */
    app.config.globalProperties.$formkit = createPlugin(app, config)
    /**
     * Provide the config to the application for injection.
     */
    app.provide(configSymbol, config)
  },
}

export default plugin
