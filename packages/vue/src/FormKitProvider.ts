import { defineComponent, SetupContext } from 'vue'
import {
  FormKitOptions,
  FormKitRootConfig,
  createConfig,
} from '@formkit/core'
import { optionsSymbol, configSymbol } from './plugin'
import { provide, inject, onScopeDispose } from 'vue'
import { h } from 'vue'
import { Suspense } from 'vue'
import { getCurrentInstance } from 'vue'
import { ComponentInternalInstance } from 'vue'
import { VNode } from 'vue'

/**
 * Removes a rootConfig from the global __FORMKIT_CONFIGS__ array.
 * @param rootConfig - The config to remove
 * @internal
 */
export function removeConfig(rootConfig: FormKitRootConfig) {
  if (typeof window !== 'undefined' && globalThis.__FORMKIT_CONFIGS__) {
    const index = globalThis.__FORMKIT_CONFIGS__.indexOf(rootConfig)
    if (index !== -1) {
      globalThis.__FORMKIT_CONFIGS__.splice(index, 1)
    }
  }
}

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
  /**
   * Clean up when the scope is disposed (component unmounted).
   */
  onScopeDispose(() => {
    removeConfig(rootConfig)
  })
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

/**
 * The FormKitConfigLoader is an async component (meaning it needs a parent or
 * grandparent Suspense component to render) that loads the FormKit config and
 * provides it to the children.
 *
 * @internal
 */
const FormKitConfigLoader = /* #__PURE__ */ defineComponent(
  async function FormKitConfigLoader(props: ConfigLoaderProps, context) {
    let config = {}
    if (props.configFile) {
      const configFile = await import(
        /*@__formkit.config.ts__*/ /* @vite-ignore */ /* webpackIgnore: true */ props.configFile
      )
      config = 'default' in configFile ? configFile.default : configFile
    }
    // Ensure this a factory function for runtimeConfig in nuxt.
    if (typeof config === 'function') {
      config = config()
    }
    /* @__default-config__ */
    const useDefaultConfig = props.defaultConfig ?? true
    if (useDefaultConfig) {
      const { defaultConfig } = await import('./defaultConfig')
      config = /* @__PURE__ */ defaultConfig(config)
    }
    /* @__default-config__ */
    return () => h(FormKitProvider, { ...context.attrs, config }, context.slots)
  },
  {
    props: ['defaultConfig', 'configFile'],
    inheritAttrs: false,
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
 *
 * @public
 */
export const FormKitLazyProvider = /* #__PURE__ */ defineComponent(
  function FormKitLazyProvider(
    props: ConfigLoaderProps,
    context: SetupContext<typeof Suspense>
  ) {
    const config = inject(optionsSymbol, null)
    /* pass any attrs through */
    const passthru = (vnode: VNode) => {
      return h(vnode, {
        ...context.attrs,
        ...vnode.props,
      })
    }
    if (config) {
      // If there is already a config provided, render the children immediately.
      return () =>
        context.slots?.default ? context.slots.default().map(passthru) : null
    }
    const instance = getCurrentInstance() as ComponentInternalInstance & {
      suspense?: boolean
    }
    if (instance.suspense) {
      // If there is a suspense boundary already in place, we can render the
      // config loader without another suspense boundary.
      return () =>
        h(FormKitConfigLoader, props, {
          default: () =>
            context.slots?.default
              ? context.slots.default().map(passthru)
              : null,
        })
    }
    // If there is no suspense boundary, and no config, we render the suspense
    // boundary and the config loader.
    return () =>
      h(Suspense, null, {
        ...context.slots,
        default: () =>
          h(FormKitConfigLoader, { ...context.attrs, ...props }, context.slots),
      })
  },
  {
    props: ['defaultConfig', 'configFile'],
    inheritAttrs: false,
  }
)
