import plugin from 'tailwindcss/plugin'

const formKitStates = plugin(({ addVariant }) => {
  addVariant('formkit-disabled', ['&[data-disabled]', '[data-disabled] &', '[data-disabled]&'])
  addVariant('formkit-invalid', ['&[data-invalid]', '[data-invalid] &', '[data-invalid]&'])
  addVariant('formkit-errors', ['&[data-errors]', '[data-errors] &', '[data-errors]&'])
  addVariant('formkit-complete', ['&[data-complete]', '[data-complete] &', '[data-complete]&'])
  addVariant('formkit-loading', ['&[data-loading]', '[data-loading] &', '[data-loading]&'])
  addVariant('formkit-submitted', ['&[data-submitted]', '[data-submitted] &', '[data-submitted]&'])
  addVariant('formkit-multiple', ['&[data-multiple]', '[data-multiple] &', '[data-multiple]&'])
})
export default formKitStates
