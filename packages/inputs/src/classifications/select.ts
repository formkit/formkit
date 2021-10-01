import { FormKitExtendableSchemaRoot } from '@formkit/schema'
import label from '../composables/label'
import outer from '../composables/outer'
import wrapper from '../composables/wrapper'
import inner from '../composables/inner'
import select from '../composables/select'
import options from '../composables/options'
import help from '../composables/help'
import messages from '../composables/messages'
import message from '../composables/message'

/**
 * The schema for text classifications.
 * @public
 */
const textSchema: FormKitExtendableSchemaRoot = (extensions = {}) => [
  outer(extensions.outer, [
    wrapper(extensions.wrapper, [
      label(extensions.label, '$label'),
      inner(extensions.inner, [
        select(extensions.input, [options(extensions.options, '$label')]),
      ]),
    ]),
    help(extensions.help, '$help'),
    messages(extensions.messages, [
      message(extensions.message, '$message.value'),
    ]),
  ]),
]

export default textSchema
