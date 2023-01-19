import plugin from 'windicss/plugin'

const outerAttributes = [
  'disabled',
  'invalid',
  'errors',
  'complete',
  'loading',
  'submitted',
  'checked',
  'multiple',
  'prefix-icon',
  'suffix-icon',
]

/**
 * The FormKit plugin for WindiCSS
 * @public
 */
const FormKitVariants = plugin(({ addVariant }) => {
  outerAttributes.forEach((attribute) => {
    addVariant(`formkit-${attribute}`, ({ modifySelectors }) => {
      return modifySelectors(({ className }) => {
        return `[data-${attribute}='true']:not([data-type='repeater']).${className},
        [data-${attribute}='true']:not([data-type='repeater']) .${className}`
      })
    })
  })
})

export default FormKitVariants
