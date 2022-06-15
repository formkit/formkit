import { FormKitTypeDefinition } from '@formkit/core'
import { formInput, messages, message, actions, submitInput } from '../sections'
import { forms, disablesChildren } from '../features'

/**
 * Input definition for a form.
 * @public
 */
export const form: FormKitTypeDefinition = {
  /**
   * The actual schema of the input, or a function that returns the schema.
   */
  // prettier-ignore
  schema: formInput(
    '$slots.default',
    messages(
      message('$message.value')
    ),
    actions(submitInput())
  ),
  /**
   * The type of node, can be a list, group, or input.
   */
  type: 'group',
  /**
   * An array of extra props to accept for this input.
   */
  props: [
    'actions',
    'submit',
    'submitLabel',
    'submitAttrs',
    'submitBehavior',
    'incompleteMessage',
  ],
  /**
   * Additional features that should be added to your input
   */
  features: [forms, disablesChildren],
}
