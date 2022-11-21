import type { FormKitNode } from './node'

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
