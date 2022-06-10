import { h, ref, defineComponent, inject } from 'vue'
import { optionsSymbol } from './plugin'
import { FormKitPlugin } from '@formkit/core'
import { FormKitIconLoader } from '@formkit/themes'

export const FormKitIcon = defineComponent({
  props: {
    icon: {
      type: String,
      default: ''
    }
  },
  setup (props) {
    const icon = ref<undefined|string>(undefined)
    const config = inject(optionsSymbol)
    const iconPlugin = config?.plugins?.find(plugin => {
      return typeof (plugin as FormKitPlugin & { iconHandler: FormKitIconLoader }).iconHandler === 'function'
    }) as FormKitPlugin & { iconHandler: FormKitIconLoader } | undefined
    if (iconPlugin) {
      const iconOrPromise = iconPlugin.iconHandler(props.icon)
      if (iconOrPromise instanceof Promise) {
        iconOrPromise.then((iconValue) => {
          icon.value = iconValue
        })
      } else {
        icon.value = iconOrPromise
      }
    }
    return () => {
      if (icon.value) {
        return h(
          'span',
          {
            class: 'formkit-icon',
            innerHTML: icon.value
          }
        )
      }
      return null
    }
  }
})
