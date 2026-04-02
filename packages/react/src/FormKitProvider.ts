import {
  FormKitOptions,
  FormKitRootConfig,
  createConfig,
} from '@formkit/core'
import {
  Children,
  Fragment,
  ReactNode,
  cloneElement,
  createElement,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { configSymbol, optionsSymbol } from './plugin'

/**
 * Removes a rootConfig from the global __FORMKIT_CONFIGS__ array.
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

function normalizeOptions(
  config?: FormKitOptions | ((...args: any[]) => FormKitOptions)
): FormKitOptions {
  const resolvedConfig =
    typeof config === 'function' ? config() : config

  if (resolvedConfig?.config?.rootConfig) {
    return resolvedConfig
  }

  const options = Object.assign(
    {
      alias: 'FormKit',
      schemaAlias: 'FormKitSchema',
    },
    resolvedConfig
  )

  const rootConfig = createConfig(options.config || {})
  options.config = { rootConfig }
  return options
}

/**
 * Creates and returns normalized FormKit options + rootConfig.
 */
export function useConfig(
  config?: FormKitOptions | ((...args: any[]) => FormKitOptions)
): {
  options: FormKitOptions
  rootConfig: FormKitRootConfig
} | null {
  return useMemo(() => {
    if (!config) return null
    const options = normalizeOptions(config)
    const rootConfig = options.config?.rootConfig as FormKitRootConfig
    return { options, rootConfig }
  }, [config])
}

export interface FormKitProviderProps {
  config?: FormKitOptions | ((...args: any[]) => FormKitOptions)
  children?: ReactNode
  [key: string]: any
}

export interface ConfigLoaderProps {
  defaultConfig?: boolean
  configFile?: string
  children?: ReactNode
  [key: string]: any
}

function passThroughChildren(
  children: ReactNode,
  attrs: Record<string, unknown>
): ReactNode {
  const attrKeys = Object.keys(attrs)
  if (!attrKeys.length) return children

  return Children.map(children, (child) => {
    if (!isValidElement(child)) return child
    const childProps = (child.props || {}) as Record<string, unknown>
    return cloneElement(child as any, {
      ...attrs,
      ...childProps,
    })
  })
}

/**
 * The FormKitProvider component provides FormKit config to descendants.
 */
export function FormKitProvider(props: FormKitProviderProps) {
  const { config, children, ...attrs } = props
  const providedConfig = useConfig(config)
  const renderedChildren = passThroughChildren(children, attrs)

  useEffect(() => {
    if (!providedConfig) return
    if (typeof window !== 'undefined') {
      globalThis.__FORMKIT_CONFIGS__ = (
        globalThis.__FORMKIT_CONFIGS__ || []
      ).concat([providedConfig.rootConfig])
      return () => removeConfig(providedConfig.rootConfig)
    }
    return
  }, [providedConfig])

  if (!providedConfig) {
    return createElement(Fragment, null, renderedChildren)
  }

  return createElement(
    optionsSymbol.Provider,
    { value: providedConfig.options },
    createElement(configSymbol.Provider, { value: providedConfig.rootConfig }, renderedChildren)
  )
}

function FormKitConfigLoader(props: ConfigLoaderProps) {
  const {
    defaultConfig: useDefaultConfig,
    configFile,
    children,
    ...attrs
  } = props
  const [config, setConfig] = useState<FormKitOptions | null>(null)

  useEffect(() => {
    let mounted = true

    ;(async () => {
      let loadedConfig: Record<string, any> | ((...args: any[]) => FormKitOptions) =
        {}

      if (configFile) {
        const configModule = await import(
          /* @vite-ignore */
          /* webpackIgnore: true */
          configFile
        )
        loadedConfig =
          'default' in configModule ? configModule.default : configModule
      }

      if (typeof loadedConfig === 'function') {
        loadedConfig = loadedConfig()
      }

      const shouldUseDefaultConfig = useDefaultConfig ?? true
      if (shouldUseDefaultConfig) {
        const { defaultConfig } = await import('./defaultConfig')
        loadedConfig = defaultConfig(loadedConfig as any)
      }

      if (mounted) {
        setConfig(loadedConfig as FormKitOptions)
      }
    })()

    return () => {
      mounted = false
    }
  }, [configFile, useDefaultConfig])

  if (!config) return null

  return createElement(FormKitProvider, { ...attrs, config }, children)
}

/**
 * Lazy provider: if config is already present, renders children directly.
 */
export function FormKitLazyProvider(props: ConfigLoaderProps) {
  const { defaultConfig, configFile, children, ...attrs } = props
  const config = useContext(optionsSymbol)
  if (config) {
    return createElement(Fragment, null, passThroughChildren(children, attrs))
  }
  return createElement(
    FormKitConfigLoader,
    { ...attrs, defaultConfig, configFile },
    children
  )
}
