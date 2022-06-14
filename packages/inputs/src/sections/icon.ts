import { createSection, FormKitSchemaExtendableSection } from '../compose'

export const icon = (sectionKey: string): FormKitSchemaExtendableSection => {
  return createSection(`${sectionKey}Icon`, () => {
    return {
      if: `$${sectionKey}Icon && $_${sectionKey}IconRaw`,
      $el: 'span',
      attrs: {
        innerHTML: `$_${sectionKey}IconRaw`
      }
    }
  })()
}
