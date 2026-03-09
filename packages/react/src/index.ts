import type { FormKitRootConfig } from '@formkit/core'

/**
 * The official FormKit/React integration package.
 *
 * @packageDocumentation
 */

declare global {
  // eslint-disable-next-line no-var
  var __FORMKIT_CONFIGS__: FormKitRootConfig[]
}

export { useInput } from './composables/useInput'
export { createInput } from './composables/createInput'
export { defineFormKitConfig } from './composables/defineFormKitConfig'

export * from './plugin'

export {
  default as FormKit,
  parentSymbol,
  componentSymbol,
  getCurrentSchemaNode,
} from './FormKit'
export type { FormKitComponent, FormKitSetupContext, Slots } from './FormKit'

export { FormKitRoot, rootSymbol } from './FormKitRoot'

export { FormKitKitchenSink } from './FormKitKitchenSink'

export { FormKitMessages } from './FormKitMessages'

export { FormKitProvider, FormKitLazyProvider, useConfig } from './FormKitProvider'

export {
  useFormKitContext,
  useFormKitContextById,
  useFormKitNodeById,
} from './composables/useContext'

export { FormKitSummary } from './FormKitSummary'
export type { FormKitSummaryMessage } from './FormKitSummary'

export {
  FormKitSchema,
} from './FormKitSchema'
export type {
  Renderable,
  RenderableList,
  RenderableSlot,
  RenderableSlots,
  FormKitComponentLibrary,
  VirtualNode,
} from './FormKitSchema'

export { defaultConfig } from './defaultConfig'
export type { DefaultConfigOptions, PluginConfigs } from './defaultConfig'

export { default as bindings } from './bindings'

export { FormKitIcon } from './FormKitIcon'

export { resetCount } from './utilities/resetCount'

export {
  errorHandler,
  setErrors,
  clearErrors,
  submitForm,
  reset,
} from '@formkit/core'

export { changeLocale } from '@formkit/i18n'

export { ssrComplete, onSSRComplete } from './composables/onSSRComplete'
