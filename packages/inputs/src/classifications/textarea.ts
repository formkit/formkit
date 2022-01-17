import { FormKitExtendableSchemaRoot } from '@formkit/core'
import label from '../composables/label'
import outer from '../composables/outer'
import wrapper from '../composables/wrapper'
import inner from '../composables/inner'
import textarea from '../composables/textarea'
import help from '../composables/help'
import messages from '../composables/messages'
import message from '../composables/message'
import prefix from '../composables/prefix'
import suffix from '../composables/suffix'

/**
 * The schema for textarea classifications.
 * @public
 */
const textareaSchema: FormKitExtendableSchemaRoot = (extensions = {}) => [
  outer(extensions.outer, [
    wrapper(extensions.wrapper, [
      label(extensions.label, '$label'),
      inner(extensions.inner, [
        prefix(extensions.prefix),
        textarea(extensions.input),
        suffix(extensions.suffix),
      ]),
    ]),
    help(extensions.help, '$help'),
    messages(extensions.messages, [
      message(extensions.message, '$message.value'),
    ]),
  ]),
]

export default textareaSchema
