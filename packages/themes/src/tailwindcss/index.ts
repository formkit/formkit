import plugin from 'tailwindcss/plugin.js'

/**
 * The FormKit plugin for Tailwind
 * @public
 */
const FormKitVariants = plugin(({ addVariant, theme }) => {
  const attributes: string[] = theme('formkit.attributes') || []
  const messageStates: string[] = theme('formkit.messageStates') || []

  addVariant('formkit-action', ['.formkit-actions &', '.formkit-actions&']);

  ['disabled', 'invalid', 'errors', 'complete', 'loading', 'submitted', 'multiple', 'has-prefix-icon', 'has-suffix-icon', ...attributes].forEach((attribute) => {
    addVariant(`formkit-${attribute}`, [`&[data-${attribute}]`, `[data-${attribute}] &`, `[data-${attribute}]&`])
  });

  ['validation', 'error', ...messageStates].forEach((state) => {
    addVariant(`formkit-message-${state}`, [`[data-message-type="${state}"] &`, `[data-message-type="${state}"]&`])
  })
})

export default FormKitVariants
