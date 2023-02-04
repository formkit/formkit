import { FormKitTypeDefinition } from '@formkit/core'
import {
  outer,
  inner,
  wrapper,
  label,
  help,
  messages,
  message,
  icon,
  prefix,
  suffix,
  textInput,
  textareaInput,
  $attrs,
  initialValue,
} from '@formkit/inputs'

export const floatingLabelTextInput: FormKitTypeDefinition = {
  schema: outer(
    wrapper(
      inner(
        icon('prefix', 'label'),
        prefix(),
        textInput(),
        $attrs(
          {
            class: '$classes.labelFloating',
            'data-has-value': '$_value !== "" && $_value !== undefined',
            for: '$id',
          },
          label('$label')
        ),
        suffix(),
        icon('suffix')
      )
    ),
    help('$help'),
    messages(message('$message.value'))
  ),

  type: 'input',

  props: [],

  features: [],
}

/**
 * Input definition for a textarea.
 * @public
 */
export const floatingLabelTextAreaInput: FormKitTypeDefinition = {
  /**
   * The actual schema of the input, or a function that returns the schema.
   */
  schema: outer(
    wrapper(
      inner(
        icon('prefix', 'label'),
        prefix(),
        textareaInput(),
        $attrs(
          {
            class: '$classes.labelFloating',
            'data-has-value': '$_value !== "" && $_value !== undefined',
            for: '$id',
          },
          label('$label')
        ),
        suffix(),
        icon('suffix')
      )
    ),
    help('$help'),
    messages(message('$message.value'))
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
  features: [initialValue],
}
