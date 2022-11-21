import type { FormKitSchemaExtendableSection } from '../compose'

/**
 * @public
 */
export const optionSlot: FormKitSchemaExtendableSection = () => ({
  $el: null,
  if: '$options.length',
  for: ['option', '$options'],
  children: '$slots.option',
})
