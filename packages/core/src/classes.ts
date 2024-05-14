import type { FormKitNode } from './node'

/**
 * Definition for a function that produces CSS classes.
 *
 * @public
 */
export interface FormKitClasses {
  (node: FormKitNode, sectionKey: string): string | Record<string, boolean>
}

/**
 * Function that produces a standardized object representation of CSS classes.
 *
 * @param propertyKey - the section key.
 * @param node - A {@link FormKitNode | FormKitNode}.
 * @param sectionClassList - A `string | Record<string, boolean>` or a {@link FormKitClasses | FormKitClasses}.
 *
 * @returns `Record<string, boolean>`
 *
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
 * Combines multiple class lists into a single list.
 *
 * @param node - A {@link FormKitNode | FormKitNode}.
 * @param property - The property key to which the class list will be applied.
 * @param args - And array of `Record<string, boolean>` of CSS class list(s).
 *
 * @returns `string | null`
 *
 * @public
 */
export function generateClassList(
  node: FormKitNode,
  property: string,
  ...args: Record<string, boolean>[]
): string | null {
  const combinedClassList = args.reduce((finalClassList, currentClassList) => {
    if (!currentClassList) return handleNegativeClasses(finalClassList)
    const { $reset, ...classList } = currentClassList
    if ($reset) {
      return handleNegativeClasses(classList)
    }
    return handleNegativeClasses(Object.assign(finalClassList, classList))
  }, {})

  return Object.keys(
    node.hook.classes.dispatch({ property, classes: combinedClassList })
      .classes
  )
    .filter((key) => combinedClassList[key])
    .join(' ') || null
}

function handleNegativeClasses(classList: Record<string, boolean>): Record<string, boolean> {
  const removalToken = '$remove:'
  let hasNegativeClassValue = false
  const applicableClasses = Object.keys(classList).filter((className) => {
    if (classList[className] && className.startsWith(removalToken)) {
      hasNegativeClassValue = true
    }
    return classList[className]
  })
  if (applicableClasses.length > 1 && hasNegativeClassValue) {
    const negativeClasses = applicableClasses.filter(className => className.startsWith(removalToken))
    negativeClasses.map((negativeClass) => {
      const targetClass = negativeClass.substring(removalToken.length)
      classList[targetClass] = false
      classList[negativeClass] = false
    })
  }
  return classList
}
