import { FormKitTypeDefinition } from '@formkit/core'
import {
  outer,
  wrapper,
  help,
  messages,
  message,
  prefix,
  suffix,
  buttonInput,
  buttonLabel,
} from '../sections'
import localize from '../features/localize'
import ignore from '../features/ignore'

const definition: FormKitTypeDefinition = {
  /**
   * The actual schema of the input, or a function that returns the schema.
   */
  // prettier-ignore
  schema: outer(
    messages(
      message('$message.value')
    ),
    wrapper(
      buttonInput(
        prefix(),
        buttonLabel('$label || $ui.submit.value'),
        suffix()
      ),
    ),
    help('$help'),
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
  features: [localize('submit'), ignore],
}

export default definition
