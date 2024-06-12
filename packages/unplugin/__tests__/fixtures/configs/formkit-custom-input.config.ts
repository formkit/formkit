import { defineFormKitConfig, createInput } from '@formkit/vue'
import CustomComponent from '../CustomComponent.vue'
import type { FormKitNode } from '@formkit/vue/core'
import { empty } from '@formkit/vue/utils'
import { de, ar } from '@formkit/vue/i18n'

const headingStyle: string | number = 'h1'

export default defineFormKitConfig({
  optimize: true,
  inputs: {
    text: {
      type: 'input',
      schema: [{ $el: headingStyle, text: 'Hello World' }],
    },
    custom: createInput(CustomComponent),
  },
  locale: 'de',
  locales: { de, ar },
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
