import { h, ref, watch, defineComponent, inject, PropType, useAttrs } from 'vue'
import { optionsSymbol } from './plugin'
import { parentSymbol } from './FormKit'
import { FormKitPlugin } from '@formkit/core'
import { FormKitIconLoader, createIconHandler } from '@formkit/themes'

/**
 * Renders an icon using the current IconLoader set at the root FormKit config
 *
 * @public
 */
export const FormKitIcon = /* #__PURE__ */ defineComponent({
  name: 'FormKitIcon',
  inheritAttrs: false,
  props: {
    icon: {
      type: String,
      default: '',
    },
    iconLoader: {
      type: Function as PropType<FormKitIconLoader>,
      default: null,
    },
    iconLoaderUrl: {
      type: Function as PropType<(iconName: string) => string>,
      default: null,
    },
  },
  setup(props) {
    const icon = ref<undefined | string>(undefined)
    const attrs = useAttrs()
    const config = inject(optionsSymbol, {})
    const parent = inject(parentSymbol, null)
    let iconHandler: FormKitIconLoader | undefined = undefined

    function loadIcon() {
      if (!iconHandler || typeof iconHandler !== 'function') return
      const iconOrPromise = iconHandler(props.icon)
      if (iconOrPromise instanceof Promise) {
        iconOrPromise.then((iconValue) => {
          icon.value = iconValue
        })
      } else {
        icon.value = iconOrPromise
      }
    }

    if (props.iconLoader && typeof props.iconLoader === 'function') {
      // if we have a locally supplied loader, then use it
      iconHandler = createIconHandler(props.iconLoader)
    } else if (parent && parent.props?.iconLoader) {
      // otherwise try to inherit from a parent
      iconHandler = createIconHandler(parent.props.iconLoader)
    } else if (
      props.iconLoaderUrl &&
      typeof props.iconLoaderUrl === 'function'
    ) {
      iconHandler = createIconHandler(iconHandler, props.iconLoaderUrl)
    } else {
      // grab our iconHandler from the global config
      const iconPlugin = config?.plugins?.find((plugin) => {
        return (
          typeof (plugin as FormKitPlugin & { iconHandler: FormKitIconLoader })
            .iconHandler === 'function'
        )
      }) as (FormKitPlugin & { iconHandler: FormKitIconLoader }) | undefined
      if (iconPlugin) {
        iconHandler = iconPlugin.iconHandler
      }
    }

    watch(
      () => props.icon,
      () => {
        loadIcon()
      },
      { immediate: true },
    )

    return () => {
      if (props.icon && icon.value) {
        const {
          class: iconClass,
          onKeydown: onKeydownAttr,
          onKeyDown: onKeyDownAttr,
          ...passThroughAttrs
        } = attrs
        const clickable = hasEventHandler(passThroughAttrs.onClick)
        const onKeydown = onKeydownAttr || onKeyDownAttr
        const iconAttrs: Record<string, unknown> = {
          ...passThroughAttrs,
          class: ['formkit-icon', iconClass],
          innerHTML: icon.value,
        }
        if (clickable) {
          iconAttrs.role = attrs.role || 'button'
          if (attrs.tabindex === undefined && attrs.tabIndex === undefined) {
            iconAttrs.tabindex = '0'
          }
          iconAttrs.onKeydown = (e: KeyboardEvent) => {
            callEventHandler(onKeydown, e)
            if (!e.defaultPrevented && isKeyboardClick(e)) {
              e.preventDefault()
              if (e.currentTarget instanceof HTMLElement) {
                e.currentTarget.click()
              }
            }
          }
        }
        return h('span', iconAttrs)
      }
      return null
    }
  },
})

function hasEventHandler(handler: unknown): boolean {
  return typeof handler === 'function' || Array.isArray(handler)
}

function callEventHandler(handler: unknown, event: Event) {
  if (Array.isArray(handler)) {
    handler.forEach((eventHandler) => callEventHandler(eventHandler, event))
  } else if (typeof handler === 'function') {
    handler(event)
  }
}

function isKeyboardClick(e: KeyboardEvent): boolean {
  return e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar'
}

export default FormKitIcon
