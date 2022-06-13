import { FormKitSchemaExtendableSection } from '../compose'

export const optionSlot: FormKitSchemaExtendableSection = () => ({
  $el: null,
  if: '$options.length',
  for: ['option', '$options'],
  children: '$slots.option',
})
