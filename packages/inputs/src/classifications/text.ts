import { FormKitExtendableSchemaRoot } from '@formkit/schema'
import label from '../partials/label'
import outer from '../partials/outer'
import wrapper from '../partials/outer'
import inner from '../partials/inner'
import text from '../partials/text'
import help from '../partials/help'
import messages from '../partials/messages'
import message from '../partials/message'

/**
 * The schema for text classifications.
 * @public
 */
const textSchema: FormKitExtendableSchemaRoot = (extensions = {}) => [
  outer(extensions.outer, [
    wrapper(extensions.wrapper, [
      label(extensions.label, '$label'),
      inner(extensions.inner, [text(extensions.input)]),
    ]),
    help(extensions.help, '$help'),
    messages(extensions.messages, [
      message(extensions.message, '$message.value'),
    ]),
  ]),
]

export default textSchema
