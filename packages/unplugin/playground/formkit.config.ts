import { defineFormKitConfig } from '@formkit/vue'
import type { FormKitNode } from '@formkit/core'
import { empty } from '@formkit/utils'
import de from '@formkit/i18n/locales/de'
import zh from '@formkit/i18n/locales/zh'

export default defineFormKitConfig({
  optimize: true,
  inputs: {
    custom: {
      type: 'input',
      schema: [{ $el: 'h1', children: 'Here i am!' }],
    },
  },
  locale: 'de',
  locales: { de, zh },
  localize: ['remove'],
  messages: {
    en: {
      validation: {
        required: 'You really need to fill out this field',
      },
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
  iconLoader: async (iconName: string): Promise<string | undefined> => {
    const res = await fetch(
      `https://cdn.jsdelivr.net/npm/heroicons/24/outline/${iconName}.svg`
    )
    if (res.ok) {
      const icon = await res.text()
      if (icon.startsWith('<svg')) {
        return icon
      }
    }
    return undefined
  },
})
