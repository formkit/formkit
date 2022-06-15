import { FormKitTypeDefinition } from '@formkit/core'
import {
  outer,
  inner,
  wrapper,
  label,
  help,
  messages,
  message,
  prefix,
  suffix,
  icon,
  selectInput,
  option,
  optionSlot,
} from '../sections'
import { $if } from '../compose'
import { options, selects } from '../features'

/**
 * Input definition for a select.
 * @public
 */
export const select: FormKitTypeDefinition = {
  /**
   * The actual schema of the input, or a function that returns the schema.
   */
  // prettier-ignore
  schema: outer(
    wrapper(
      label('$label'),
      inner(
        icon('prefix'),
        prefix(),
        selectInput(
          $if(
            '$slots.default',
            () => '$slots.default',
            $if('$slots.option',
              optionSlot,
              option('$option.label')
            )
          )
        ),
        icon('select'),
        suffix(),
        icon('prefix')
      )
    ),
    help('$help'),
    messages(
      message('$message.value')
    )
  ),
  /**
   * The type of node, can be a list, group, or input.
   */
  type: 'input',
  /**
   * An array of extra props to accept for this input.
   */
  props: ['options', 'placeholder'],
  /**
   * Additional features that should be added to your input
   */
  features: [options, selects],
}
