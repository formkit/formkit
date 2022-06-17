import { FormKitTypeDefinition } from '@formkit/core'
import {
  outer,
  wrapper,
  help,
  messages,
  message,
  icon,
  prefix,
  suffix,
  buttonInput,
  buttonLabel,
  localize,
  ignores,
} from '../'

/**
 * Input definition for a button.
 * @public
 */
export const button: FormKitTypeDefinition = {
  /**
   * The actual schema of the input, or a function that returns the schema.
   */
  schema: outer(
    messages(message('$message.value')),
    wrapper(
      buttonInput(
        icon('prefix'),
        prefix(),
        buttonLabel('$label || $ui.submit.value'),
        suffix(),
        icon('suffix')
      )
    ),
    help('$help')
  ),
  /**
   * The type of node, can be a list, group, or input.
   */
  type: 'input',
  /**
   * An array of extra props to accept for this input.
   */
  props: [],
  /**
   * Additional features that should be added to your input
   */
  features: [localize('submit'), ignores],
}
