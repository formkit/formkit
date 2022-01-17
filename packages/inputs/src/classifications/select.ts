import { FormKitExtendableSchemaRoot } from '@formkit/core'
import label from '../composables/label'
import outer from '../composables/outer'
import wrapper from '../composables/wrapper'
import inner from '../composables/inner'
import select from '../composables/select'
import option from '../composables/option'
import help from '../composables/help'
import messages from '../composables/messages'
import message from '../composables/message'
import prefix from '../composables/prefix'
import suffix from '../composables/suffix'

/**
 * The schema for text classifications.
 * @public
 */
const textSchema: FormKitExtendableSchemaRoot = (extensions = {}) => [
  outer(extensions.outer, [
    wrapper(extensions.wrapper, [
      label(extensions.label, '$label'),
      inner(extensions.inner, [
        prefix(extensions.prefix),
        select(extensions.input, [option(extensions.option, '$option.label')]),
        suffix(extensions.suffix),
      ]),
    ]),
    help(extensions.help, '$help'),
    messages(extensions.messages, [
      message(extensions.message, '$message.value'),
    ]),
  ]),
]

export default textSchema
