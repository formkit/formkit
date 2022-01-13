import { FormKitExtendableSchemaRoot } from '@formkit/core'
import outer from '../composables/outer'
import wrapper from '../composables/wrapper'
import help from '../composables/help'
import button from '../composables/button'
import messages from '../composables/messages'
import message from '../composables/message'
import prefix from '../composables/prefix'
import suffix from '../composables/suffix'

/**
 * The schema for text classifications.
 * @public
 */
const buttonSchema: FormKitExtendableSchemaRoot = (extensions = {}) => [
  outer(extensions.outer, [
    messages(extensions.messages, [
      message(extensions.message, '$message.value'),
    ]),
    wrapper(extensions.wrapper, [
      button(extensions.input, [
        prefix(extensions.prefix),
        {
          if: '$slots.default',
          then: '$slots.default',
          else: {
            if: '$label',
            then: '$label',
            else: '$ui.submit.value',
          },
        },
        suffix(extensions.suffix),
      ]),
    ]),
    help(extensions.help, '$help'),
  ]),
]

export default buttonSchema
