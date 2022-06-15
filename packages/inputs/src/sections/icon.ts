import { createSection, FormKitSchemaExtendableSection } from '../compose'

/**
 * @public
 */
export const icon = (sectionKey: string): FormKitSchemaExtendableSection => {
  return createSection(`${sectionKey}Icon`, () => {
    return {
      if: `$${sectionKey}Icon && $_${sectionKey}IconRaw`,
      $el: 'span',
      attrs: {
        innerHTML: `$_${sectionKey}IconRaw`,
      },
    }
  })()
}
