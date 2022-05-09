import { FormKitNode, FormKitClasses } from '@formkit/core'

export { default as formKitTailwind } from './tailwindcss'
export { default as formKitUno } from './unocss'
export { default as formKitWindi } from './windicss'

/**
 * A function that returns a class list string
 * @internal
 */
 type ClassFunction = (
  node: FormKitNode,
  sectionKey: string
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
    classesBySectionKey[sectionKey] = function (node, sectionKey) {
      return addClassesBySection(node, sectionKey, classesObject)
    } as ClassFunction
  })

  return classesBySectionKey;
}

/**
 * Updates a class list for a given sectionKey
 * @param node - the FormKit node being operated on
 * @param sectionKey - The section key to which the class list will be applied
 * @param classByType - Object containing mappings of class lists to section keys
 * @returns
 * @public
 */
function addClassesBySection(
  node: FormKitNode,
  _sectionKey: string,
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
  const listParts = classList.split('$reset')
  if (listParts.length > 1) {
    return `$reset ${listParts[listParts.length - 1].trim()}`
  }
  return listParts[0].trim()
}
