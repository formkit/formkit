import { FormKitTypeDefinition } from '@formkit/core'
import { form as formEl, messages, message, actions, submit } from '../sections'
import formHandler from '../features/form'
import disablesChildren from '../features/disables'

/**
 * Input definition for a form.
 * @public
 */
export const form: FormKitTypeDefinition = {
  /**
   * The actual schema of the input, or a function that returns the schema.
   */
  // prettier-ignore
  schema: formEl(
    '$slots.default',
    messages(
      message('$message.value')
    ),
    actions(submit())
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
  features: [formHandler, disablesChildren],
}
