import { createSection, FormKitSchemaExtendableSection } from '@formkit/inputs'

/**
 * Icon section used by multi-step steps
 *
 * @public
 */
export const stepIcon = (
  sectionKey: string,
  el?: string
): FormKitSchemaExtendableSection => {
  return createSection(`${sectionKey}Icon`, () => {
    const rawIconProp = `_raw${sectionKey
      .charAt(0)
      .toUpperCase()}${sectionKey.slice(1)}Icon`
    return {
      if: `$step.${sectionKey}Icon && $step.${rawIconProp}`,
      $el: `${el ? el : 'span'}`,
      attrs: {
        class: `$classes.${sectionKey}Icon + " formkit-icon"`,
        innerHTML: `$step.${rawIconProp}`,
        role: 'presentation',
        onClick: `$handlers.iconClick(${sectionKey})`,
      },
    }
  })()
}
