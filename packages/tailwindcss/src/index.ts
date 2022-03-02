import plugin from 'tailwindcss/plugin'

const formKitStates = plugin(({ addVariant }) => {
  addVariant('formkit-invalid', ['[data-type][data-invalid]', '[data-type][data-invalid] &'])
  addVariant('formkit-errors', ['[data-type][data-errors]', '[data-type][data-errors] &'])
  addVariant('formkit-disabled', ['[data-type][data-disabled]', '[data-type][data-disabled] &'])
  addVariant('formkit-complete', ['[data-type][data-complete]', '[data-type][data-complete] &'])
  addVariant('formkit-multiple', ['[data-type][data-multiple]', '[data-type][data-multiple] &'])
})
export default formKitStates
