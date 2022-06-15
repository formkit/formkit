import { createSection, FormKitSchemaExtendableSection } from '../compose'

export const icon = (sectionKey: string, el?: string): FormKitSchemaExtendableSection => {
  return createSection(`${sectionKey}Icon`, () => {
    const rawIconProp = `_raw${sectionKey.charAt(0).toUpperCase()}${sectionKey.slice(1)}Icon`
    return {
      if: `$${sectionKey}Icon && $${rawIconProp}`,
      $el: `${el ? el : 'span'}`,
      attrs: {
        class: `$classes.${sectionKey}Icon + " formkit-icon"`,
        innerHTML: `$${rawIconProp}`,
        for: {
          if: `${el === 'label'}`,
          then: '$id'
        }
      }
    }
  })()
}
