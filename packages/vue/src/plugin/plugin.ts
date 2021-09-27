import { has } from '@formkit/utils'
import {
  FormKitSchemaNode,
  FormKitLibrary,
  FormKitOptions,
} from '@formkit/core'
import { FormKitSchemaCondition } from '@formkit/schema'
import { App, Plugin } from 'vue'

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
  schema: (type: string) => FormKitSchemaCondition | FormKitSchemaNode[] | null
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
  return {
    schema: (type) => {
      return has(config.library, type) ? config.library[type].schema : null
    },
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
 * Create the FormKit plugin.
 */
const formKitPlugin: Plugin = {
  install(app, options): void {
    /**
     * Extend the default configuration options.
     */
    const config = Object.assign({}, minConfig, options)

    /**
     * Register the global $formkit plugin property.
     */
    app.config.globalProperties.$formkit = createPlugin(app, config)
  },
}

export default formKitPlugin
