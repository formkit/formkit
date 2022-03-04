import plugin from 'tailwindcss/plugin'

const formKitStates = plugin(({ addVariant }) => {
  addVariant('formkit-disabled', ['[data-type][data-disabled]', '[data-type][data-disabled] &'])
  addVariant('formkit-invalid', ['[data-type][data-invalid]', '[data-type][data-invalid] &'])
  addVariant('formkit-errors', ['[data-type][data-errors]', '[data-type][data-errors] &'])
  addVariant('formkit-complete', ['[data-type][data-complete]', '[data-type][data-complete] &'])
  addVariant('formkit-loading', ['[data-type][data-loading]', '[data-type][data-loading] &'])
  addVariant('formkit-submitted', ['[data-type][data-submitted]', '[data-type][data-submitted] &'])
  addVariant('formkit-multiple', ['[data-type][data-multiple]', '[data-type][data-multiple] &'])
})
export default formKitStates
