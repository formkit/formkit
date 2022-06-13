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
  selectInput,
  option,
  optionSlot,
} from '../sections'
import { $if } from '../compose'
import formatsOptions from '../features/options'
import selectFeatures from '../features/select'

const definition: FormKitTypeDefinition = {
  /**
   * The actual schema of the input, or a function that returns the schema.
   */
  // prettier-ignore
  schema: outer(
    wrapper(
      label('$label'),
      inner(
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
        suffix()
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
  features: [formatsOptions, selectFeatures],
}

export default definition
