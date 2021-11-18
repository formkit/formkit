import { FormKitExtendableSchemaRoot } from '@formkit/core'
import actions from '../composables/actions'
import form from '../composables/form'
import submit from '../composables/submit'
import messages from '../composables/messages'
import message from '../composables/message'

const formSchema: FormKitExtendableSchemaRoot = (extensions = {}) => {
  return [
    form(extensions.form, [
      '$slots.default',
      messages(extensions.messages, [
        message(extensions.message, '$message.value'),
      ]),
      actions(extensions.actions, [submit(extensions.submit)]),
    ]),
  ]
}

export default formSchema
