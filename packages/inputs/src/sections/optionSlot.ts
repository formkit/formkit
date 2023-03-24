import { FormKitSchemaExtendableSection } from '../createSection'

/**
 * Options slot section that displays options when used with slots
 *
 * @public
 */
export const optionSlot: FormKitSchemaExtendableSection = () => ({
  $el: null,
  if: '$options.length',
  for: ['option', '$options'],
  children: '$slots.option',
})
