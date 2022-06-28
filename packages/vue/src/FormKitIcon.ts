import { h, ref, defineComponent, inject, PropType } from 'vue'
import { optionsSymbol } from './plugin'
import { parentSymbol } from './FormKit'
import { FormKitPlugin } from '@formkit/core'
import { FormKitIconLoader, createIconHandler } from '@formkit/themes'

/**
 * Renders an icon using the current IconLoader set at the root FormKit config
 * @public
 */
export const FormKitIcon = defineComponent({
  props: {
    icon: {
      type: String,
      default: ''
    },
    loader: {
      type: Function as PropType<FormKitIconLoader>,
      default: null
    }
  },
  setup (props) {
    const icon = ref<undefined|string>(undefined)
    const config = inject(optionsSymbol)
    const parent = inject(parentSymbol)
    let iconHandler: FormKitIconLoader | undefined = undefined

    if (props.loader && typeof props.loader === 'function') {
      // if we have a locally supplied loader, then use it
      iconHandler = createIconHandler(props.loader)
    } else if (parent && parent.props?.iconLoader) {
      // otherwise try to inherit from a parent
      iconHandler = createIconHandler(parent.props.iconLoader)
    } else {
      // grab our iconHandler from the global config
      const iconPlugin = config?.plugins?.find(plugin => {
        return typeof (plugin as FormKitPlugin & { iconHandler: FormKitIconLoader }).iconHandler === 'function'
      }) as FormKitPlugin & { iconHandler: FormKitIconLoader } | undefined
      if (iconPlugin) {
        iconHandler = iconPlugin.iconHandler
      }
    }
    if (iconHandler && typeof iconHandler === 'function') {
      const iconOrPromise = iconHandler(props.icon)
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

export default FormKitIcon
