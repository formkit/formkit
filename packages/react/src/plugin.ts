import {
  FormKitOptions,
  FormKitNode,
  FormKitRootConfig,
  getNode,
  createConfig,
  setErrors,
  clearErrors,
  submitForm,
  reset,
} from '@formkit/core'
import { createContext } from 'react'

/**
 * The global instance API for FormKit in React applications.
 */
export interface FormKitReactPlugin {
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
  options: FormKitOptions
  rootConfig: FormKitRootConfig
}

/**
 * React context for FormKit options.
 */
export const optionsSymbol = createContext<FormKitOptions | null>(null)

/**
 * React context for FormKit root config.
 */
export const configSymbol = createContext<FormKitRootConfig | null>(null)

/**
 * Create a React plugin instance (no global registration required).
 */
export function createPlugin(
  _options: FormKitOptions | ((...args: any[]) => FormKitOptions)
): FormKitReactPlugin {
  const options: FormKitOptions = Object.assign(
    {
      alias: 'FormKit',
      schemaAlias: 'FormKitSchema',
    },
    typeof _options === 'function' ? _options() : _options
  )

  const rootConfig = createConfig(options.config || {})
  options.config = { rootConfig }

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
    options,
    rootConfig,
  }
}

/**
 * Alias used by consumers who expect a `plugin` export.
 */
export const plugin = createPlugin
