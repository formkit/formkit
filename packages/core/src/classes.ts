import { FormKitNode } from './node'

/**
 * A function that returns a class list string
 * @internal
 */
 type ClassFunction = (
  node: FormKitNode,
  sectionKey: string
) => string

/**
 * Definition for a function that produces CSS classes
 * @public
 */
export interface FormKitClasses {
  (node: FormKitNode, sectionKey: string): string | Record<string, boolean>
}

/**
 * Function that produces a standardized object representation of CSS classes
 * @param propertyKey - section key
 * @param node - FormKit node
 * @param sectionClassList - Things to turn into classes
 * @returns
 * @public
 */
export function createClasses(
  propertyKey: string,
  node: FormKitNode,
  sectionClassList?: FormKitClasses | string | Record<string, boolean>
): Record<string, boolean> {
  if (!sectionClassList) return {}
  if (typeof sectionClassList === 'string') {
    const classKeys = sectionClassList.split(' ')
    return classKeys.reduce(
      (obj, key) => Object.assign(obj, { [key]: true }),
      {}
    )
  } else if (typeof sectionClassList === 'function') {
    return createClasses(
      propertyKey,
      node,
      sectionClassList(node, propertyKey)
    )
  }
  return sectionClassList
}

/**
 * Combines multiple class lists into a single list
 * @param node - the FormKit node being operated on
 * @param property - The property key to which the class list will be applied
 * @param args - CSS class list(s)
 * @returns
 * @public
 */
export function generateClassList(
  node: FormKitNode,
  property: string,
  ...args: Record<string, boolean>[]
): string | null {
  const combinedClassList = args.reduce((finalClassList, currentClassList) => {
    if (!currentClassList) return finalClassList
    const { $reset, ...classList } = currentClassList
    if ($reset) {
      return classList
    }
    return Object.assign(finalClassList, classList)
  }, {})

  return (
    Object.keys(
      node.hook.classes.dispatch({ property, classes: combinedClassList })
        .classes
    )
      .filter((key) => combinedClassList[key])
      .join(' ') || null
  )
}

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
  return classList.trim()
}
