import { FormKitSchemaNode, isComponent, isDOM } from '@formkit/core'

interface FormKitSection {
  (...children: FormKitSection[]): (
    extensions: Record<string, Partial<FormKitSchemaNode>>
  ) => FormKitSchemaNode
}

export function createSection(
  section: string,
  el: string | (() => FormKitSchemaNode)
): FormKitSection {
  return (...children: FormKitSection[]) => {
    return (extensions: Record<string, Partial<FormKitSchemaNode>>) => {
      const node =
        typeof el === 'string'
          ? { $el: el, attrs: { class: `$classes.${section}` } }
          : el()
      if (isDOM(node) || isComponent(node)) {
        if (!node.meta) {
          node.meta = { section }
        }
        if (children.length && !node.children) {
          node.children = [...children.map((child) => child(extensions))]
        }
      }
      return {
        if: `$slots.${section}`,
        then: `$slots.${section}`,
        else: node,
      }
    }
  }
}

const outer = createSection('outer', 'div')
const inner = createSection('inner', 'div')
