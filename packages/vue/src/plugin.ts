import { FormKitOptions, FormKitNode, get } from '@formkit/core'
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
 * The global instance of the FormKit plugin.
 * @public
 */
export interface FormKitVuePlugin {
  get: (id: string) => FormKitNode | undefined
}

/**
 * The Create a new instance of the FormKit plugin for Vue.
 * @param app - A Vue application
 * @param config - FormKit Vue plugin configuration options
 */
function createPlugin(
  app: App<any>,
  config: FormKitOptions & Record<string, any>
): FormKitVuePlugin {
  app.component(config.alias || 'FormKit', FormKit)
  return {
    get,
  }
}

/**
 * The symbol key for accessing the formkit config.
 * @public
 */
export const configSymbol: InjectionKey<FormKitOptions> = Symbol(
  'FormKitConfig'
)

/**
 * Create the FormKit plugin.
 * @public
 */
export const plugin: Plugin = {
  install(
    app,
    options: FormKitOptions | ((...args: any[]) => FormKitOptions)
  ): void {
    /**
     * Extend the default configuration options.
     */
    const config: FormKitOptions = Object.assign(
      {
        alias: 'FormKit',
      },
      typeof options === 'function' ? options() : options
    )

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
