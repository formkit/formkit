import { defineFormKitConfig } from '@formkit/vue'
import type { FormKitNode } from '@formkit/core'

function myrule(node: FormKitNode) {
  return node.value === 'justin'
}

export default defineFormKitConfig({
  optimize: {
    validation: {
      builtins: false,
      optimize: false,
    },
  },
  rules: {
    myrule,
  },
})
