import { FormKitNode, FormKitClasses } from '@formkit/core'
import plugin from 'tailwindcss/plugin'

// FormKit plugin for Tailwind
// used in tailwind.config.js
const formKitVariants = plugin(({ addVariant }) => {
  addVariant('formkit-disabled', ['&[data-disabled]', '[data-disabled] &', '[data-disabled]&'])
  addVariant('formkit-invalid', ['&[data-invalid]', '[data-invalid] &', '[data-invalid]&'])
  addVariant('formkit-errors', ['&[data-errors]', '[data-errors] &', '[data-errors]&'])
  addVariant('formkit-complete', ['&[data-complete]', '[data-complete] &', '[data-complete]&'])
  addVariant('formkit-loading', ['&[data-loading]', '[data-loading] &', '[data-loading]&'])
  addVariant('formkit-submitted', ['&[data-submitted]', '[data-submitted] &', '[data-submitted]&'])
  addVariant('formkit-multiple', ['&[data-multiple]', '[data-multiple] &', '[data-multiple]&'])
})

// Helper function for Tailwind styling.
// to be imported and used in FormKit config
export function generateClasses (
  classes:Record<string, Record<string, string>>
): any {
  const classesBySectionKey:Record<string, Record<string, any>> = {}
  Object.keys(classes).forEach(type => {
    Object.keys(classes[type]).forEach(sectionKey => {
      if (!classesBySectionKey[sectionKey]) {
        classesBySectionKey[sectionKey] = {
          [type]: classes[type][sectionKey]
        }
      } else {
        classesBySectionKey[sectionKey][type] = classes[type][sectionKey]
      }
    })
  })

  Object.keys(classesBySectionKey).forEach(sectionKey => {
    const classesObject = classesBySectionKey[sectionKey]
    classesBySectionKey[sectionKey] = function(
      node: FormKitNode,
      sectionKey: string,
      sectionClassList: FormKitClasses | string | Record<string, boolean>,
      classesByType: any = classesObject
    ) {
      return formKitStates(node, sectionKey, sectionClassList, classesByType)
    }
  })

  return classesBySectionKey
}

function formKitStates (
  node: FormKitNode,
  sectionKey: string,
  sectionClassList: FormKitClasses | string | Record<string, boolean>,
  classesByType: any
): string {
  if (!sectionClassList) {
    // just doing this because typescript won't let me not
    // touch the argument. Need advice
    sectionClassList = ''
  }
  if (!sectionKey) {
    // just doing this because typescript won't let me not
    // touch the argument. Need advice
    sectionKey = ''
  }

  const type = node.props.type
  let classList = ''
  if (classesByType.global) {
    classList += classesByType.global + ' '
  }
  if (classesByType[type]) {
    classList += classesByType[type]
  }
  return classList.trim()
}

export default formKitVariants
