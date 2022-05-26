import plugin from 'windicss/plugin'

/**
 * The FormKit plugin for WindiCSS
 * @public
 */
const FormKitVariants = plugin(({ addVariant, theme }) => {
  const attributes: string[] = (theme('formkit.attributes', []) as string[])
  const messageStates: string[] = (theme('formkit.messageStates', []) as string[])

  addVariant('formkit-action', ({ modifySelectors }) => {
    return modifySelectors(({ className }) => {
      return `.formkit-actions .${className}, .formkit-actions.${className}`
    })
  });

  ['disabled', 'invalid', 'errors', 'complete', 'loading', 'submitted', 'multiple', 'has-prefix-icon', 'has-suffix-icon', ...attributes].forEach((attribute) => {
    addVariant(`formkit-${attribute}`, ({ modifySelectors }) => {
      return modifySelectors(({ className }) => {
        return `.${className}[data-${attribute}], [data-${attribute}] .${className}, [data-${attribute}].${className}`
      })
    })
  });

  ['validation', 'error', ...messageStates].forEach((state) => {
    addVariant(`formkit-message-${state}`, ({ modifySelectors }) => {
      return modifySelectors(({ className }) => {
        return `.${className}[data-message-type="${state}"], [data-message-type="${state}"] .${className}, [data-message-type="${state}"].${className}`
      })
    })
  });
})

export default FormKitVariants
