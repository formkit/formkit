import { FormKitNode, FormKitClasses } from '@formkit/core'
import plugin from 'tailwindcss/plugin.js'

/**
 * The FormKit plugin for Tailwind
 * @public
 */
const formKitVariants = plugin(({ addVariant, theme }) => {
  const attributes: string[] = theme('formkit.attributes') || [];
  const messageStates: string[] = theme('formkit.messageStates') || [];

  addVariant('formkit-action', ['.formkit-actions &', '.formkit-actions&']);

  ['disabled', 'invalid', 'errors', 'complete', 'loading', 'submitted', 'multiple', ...attributes].forEach((attribute) => {
    addVariant(`formkit-${attribute}`, [`&[data-${attribute}]`, `[data-${attribute}] &`, `[data-${attribute}]&`])
  });

  ['validation', 'error', ...messageStates].forEach((state) => {
    addVariant(`formkit-message-${state}`, [`[data-message-type="${state}"] &`, `[data-message-type="${state}"]&`])
  });
});

/**
 * A function that returns a class list string
 * @internal
 */
type ClassFunction = (
  node: FormKitNode,
  sectionKey: string,
  sectionClassList: FormKitClasses | string | Record<string, boolean>
) => string

/**
 * A function to generate FormKit class functions from a javascript object
 * @param classes - An object of input types with nested objects of sectionKeys and class lists
 * @returns FormKitClassFunctions
 * @public
 */
export function generateClasses(
  classes: Record<string, Record<string, string>>
): Record<string, string | FormKitClasses | Record<string, boolean>> {
  const classesBySectionKey: Record<string, Record<string, any>> = {}
  Object.keys(classes).forEach((type) => {
    Object.keys(classes[type]).forEach((sectionKey) => {
      if (!classesBySectionKey[sectionKey]) {
        classesBySectionKey[sectionKey] = {
          [type]: classes[type][sectionKey],
        }
      } else {
        classesBySectionKey[sectionKey][type] = classes[type][sectionKey]
      }
    })
  })

  Object.keys(classesBySectionKey).forEach((sectionKey) => {
    const classesObject = classesBySectionKey[sectionKey]
    classesBySectionKey[sectionKey] = function (node, sectionKey, sectionClassList) {
      return formKitStates(node, sectionKey, sectionClassList, classesObject)
    } as ClassFunction
  })

  return classesBySectionKey;
}

function formKitStates(
  node: FormKitNode,
  _sectionKey: string,
  _sectionClassList: FormKitClasses | string | Record<string, boolean>,
  classesByType: Record<string, () => string>
): string {
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
