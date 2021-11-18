import { FormKitExtendableSchemaRoot } from '@formkit/core'
import outer from '../composables/outer'
import wrapper from '../composables/wrapper'
import help from '../composables/help'
import button from '../composables/button'
import messages from '../composables/messages'
import message from '../composables/message'

/**
 * The schema for text classifications.
 * @public
 */
const buttonSchema: FormKitExtendableSchemaRoot = (extensions = {}) => [
  outer(extensions.outer, [
    messages(extensions.messages, [
      message(extensions.message, '$message.value'),
    ]),
    wrapper(extensions.wrapper, [button(extensions.input)]),
    help(extensions.help, '$help'),
  ]),
]

export default buttonSchema
