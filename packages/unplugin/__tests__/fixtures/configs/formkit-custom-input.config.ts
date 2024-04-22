import { defineFormKitConfig, createInput } from '@formkit/vue'
import CustomComponent from '../CustomComponent.vue'
import type { FormKitNode } from '@formkit/core'
import { empty } from '@formkit/utils'

const headingStyle: string | number = 'h1'

export default defineFormKitConfig({
  inputs: {
    text: {
      type: 'input',
      schema: [{ $el: headingStyle, text: 'Hello World' }],
    },
    custom: createInput(CustomComponent),
  },
  rules: {
    length(node: FormKitNode) {
      if (empty(node.value)) return false
      if (typeof node.value === 'string' || Array.isArray(node.value)) {
        return node.value.length > 0
      }
      return false
    },
  },
})
