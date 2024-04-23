import { defineFormKitConfig } from '@formkit/vue'
import type { FormKitNode } from '@formkit/core'
import { empty } from '@formkit/utils'

export default defineFormKitConfig({
  inputs: {
    custom: {
      type: 'input',
      schema: [{ $el: 'h1', children: 'Here i am!' }],
    },
  },
  rules: {
    length(node: FormKitNode, length: string) {
      if (empty(node.value)) return false
      if (typeof node.value === 'string' || Array.isArray(node.value)) {
        return node.value.length > Number(length)
      }
      return false
    },
  },
})
