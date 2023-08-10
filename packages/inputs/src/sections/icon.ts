import { createSection, FormKitSchemaExtendableSection } from '../createSection'

/**
 * Icon section used by all icons
 *
 * @public
 */
export const icon = (
  sectionKey: string,
  el?: string
): FormKitSchemaExtendableSection => {
  return createSection(`${sectionKey}Icon`, () => {
    const rawIconProp = `_raw${sectionKey
      .charAt(0)
      .toUpperCase()}${sectionKey.slice(1)}Icon`
    return {
      if: `$${sectionKey}Icon && $${rawIconProp}`,
      $el: `${el ? el : 'span'}`,
      attrs: {
        class: `$classes.${sectionKey}Icon + " " + $classes.icon`,
        innerHTML: `$${rawIconProp}`,
        onClick: `$handlers.iconClick(${sectionKey})`,
        for: {
          if: `${el === 'label'}`,
          then: '$id',
        },
      },
    }
  })()
}
