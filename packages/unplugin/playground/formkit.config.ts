import { defineFormKitConfig } from '@formkit/vue'
import type { FormKitNode } from '@formkit/vue/core'
import { empty } from '@formkit/vue/utils'
import de from '@formkit/vue/i18n/locales/de'
import zh from '@formkit/vue/i18n/locales/zh'
import { heroIconLoader } from '@formkit/vue/icons'
import { rootClasses } from './formkit.theme'

function sillyPlugin(node: FormKitNode) {
  node.on('created', () => {
    console.log('I am a silly plugin')
  })
  return false
}

export default defineFormKitConfig({
  pro: 'fk-86977026238',
  optimize: {
    debug: true,
  },
  inputs: {
    custom: {
      type: 'input',
      schema: [{ $el: 'h1', children: 'Here i am!' }],
    },
  },
  locale: 'de',
  locales: { de, zh },
  localize: ['remove'],
  plugins: [sillyPlugin],
  rootClasses,
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
  iconLoader: heroIconLoader(),
  nodeOptions: {
    props: {
      label: 'This is foobar',
    },
  },
})
