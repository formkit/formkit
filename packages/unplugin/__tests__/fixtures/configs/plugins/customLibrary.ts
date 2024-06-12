import type { FormKitNode } from '@formkit/vue/core'
import { createInput } from '@formkit/vue'

const remove = createInput(
  {
    $el: 'button',
    children: ['$ui.removeAllValues.value'],
  },
  {
    localize: ['removeAllValues'],
    icons: {
      close: 'close',
    },
  }
)

const myLibrary = () => {}

myLibrary.library = (node: FormKitNode) => {
  if (node.props.type === 'remove') {
    return node.define(remove)
  }
}

export default myLibrary
