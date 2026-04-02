import { createElement, useContext, useEffect, useMemo, useState } from 'react'
import { FormKitPlugin } from '@formkit/core'
import { FormKitIconLoader, createIconHandler } from '@formkit/themes'
import { optionsSymbol } from './plugin'
import { parentSymbol } from './context'
import { useReactiveStore } from './reactiveStore'

export interface FormKitIconProps {
  icon: string
  iconLoader?: FormKitIconLoader | null
  iconLoaderUrl?: ((iconName: string) => string) | null
}

function resolveSyncIcon(
  iconHandler: FormKitIconLoader | undefined,
  iconName: string
) {
  if (!iconHandler || typeof iconHandler !== 'function' || !iconName) {
    return undefined
  }

  const iconOrPromise = iconHandler(iconName)
  return iconOrPromise instanceof Promise ? undefined : iconOrPromise
}

export function FormKitIcon(props: FormKitIconProps) {
  const config = useContext(optionsSymbol)
  const parent = useContext(parentSymbol)

  useReactiveStore(parent?.context)

  const iconHandler: FormKitIconLoader | undefined = useMemo(() => {
    if (props.iconLoader && typeof props.iconLoader === 'function') {
      return createIconHandler(props.iconLoader)
    }

    if (parent && parent.props?.iconLoader) {
      return createIconHandler(parent.props.iconLoader)
    }

    if (props.iconLoaderUrl && typeof props.iconLoaderUrl === 'function') {
      return createIconHandler(undefined, props.iconLoaderUrl)
    }

    const iconPlugin = config?.plugins?.find((plugin) => {
      return (
        typeof (plugin as FormKitPlugin & { iconHandler: FormKitIconLoader })
          .iconHandler === 'function'
      )
    }) as (FormKitPlugin & { iconHandler: FormKitIconLoader }) | undefined

    return iconPlugin?.iconHandler
  }, [config?.plugins, parent, props.iconLoader, props.iconLoaderUrl])

  const [icon, setIcon] = useState<undefined | string>(() =>
    resolveSyncIcon(iconHandler, props.icon)
  )

  useEffect(() => {
    if (!iconHandler || typeof iconHandler !== 'function' || !props.icon) {
      setIcon(undefined)
      return
    }

    let isActive = true
    const iconOrPromise = iconHandler(props.icon)
    if (iconOrPromise instanceof Promise) {
      iconOrPromise.then((iconValue) => {
        if (isActive) {
          setIcon(iconValue)
        }
      })
    } else {
      setIcon(iconOrPromise)
    }

    return () => {
      isActive = false
    }
  }, [iconHandler, props.icon])

  if (!props.icon || !icon) {
    return null
  }

  return createElement('span', {
    className: 'formkit-icon',
    dangerouslySetInnerHTML: { __html: icon },
  })
}

export default FormKitIcon
