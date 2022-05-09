import plugin from 'tailwindcss/plugin.js'

/**
 * The FormKit plugin for Tailwind
 * @public
 */
const formKitVariants = plugin(({ addVariant }) => {
  console.warn('@formkit/tailwindcss is deprecated in favor of @formkit/themes')

  addVariant('formkit-disabled', [
    '&[data-disabled]',
    '[data-disabled] &',
    '[data-disabled]&',
  ])
  addVariant('formkit-invalid', [
    '&[data-invalid]',
    '[data-invalid] &',
    '[data-invalid]&',
  ])
  addVariant('formkit-errors', [
    '&[data-errors]',
    '[data-errors] &',
    '[data-errors]&',
  ])
  addVariant('formkit-complete', [
    '&[data-complete]',
    '[data-complete] &',
    '[data-complete]&',
  ])
  addVariant('formkit-loading', [
    '&[data-loading]',
    '[data-loading] &',
    '[data-loading]&',
  ])
  addVariant('formkit-submitted', [
    '&[data-submitted]',
    '[data-submitted] &',
    '[data-submitted]&',
  ])
  addVariant('formkit-multiple', [
    '&[data-multiple]',
    '[data-multiple] &',
    '[data-multiple]&',
  ])
  addVariant('formkit-action', ['.formkit-actions &', '.formkit-actions&'])
  addVariant('formkit-message-validation', [
    '[data-message-type="validation"] &',
    '[data-message-type="validation"]&',
  ])
  addVariant('formkit-message-error', [
    '[data-message-type="error"] &',
    '[data-message-type="error"]&',
  ])
})

export default formKitVariants
export { generateClasses } from '@formkit/themes'
