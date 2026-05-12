import { createElement, useContext, useEffect, useMemo, useState } from 'react'
import type { HTMLAttributes, KeyboardEvent } from 'react'
import { FormKitPlugin } from '@formkit/core'
import { FormKitIconLoader, createIconHandler } from '@formkit/themes'
import { optionsSymbol } from './plugin'
import { parentSymbol } from './context'
import { useReactiveStore } from './reactiveStore'

export interface FormKitIconProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  'children' | 'dangerouslySetInnerHTML'
> {
  icon: string
  iconLoader?: FormKitIconLoader | null
  iconLoaderUrl?: ((iconName: string) => string) | null
}

function resolveSyncIcon(
  iconHandler: FormKitIconLoader | undefined,
  iconName: string,
) {
  if (!iconHandler || typeof iconHandler !== 'function' || !iconName) {
    return undefined
  }

  const iconOrPromise = iconHandler(iconName)
  return iconOrPromise instanceof Promise ? undefined : iconOrPromise
}

export function FormKitIcon(props: FormKitIconProps) {
  const {
    icon: iconName,
    iconLoader,
    iconLoaderUrl,
    className,
    onClick,
    onKeyDown,
    role,
    tabIndex,
    ...spanAttrs
  } = props
  const config = useContext(optionsSymbol)
  const parent = useContext(parentSymbol)

  useReactiveStore(parent?.context)

  const iconHandler: FormKitIconLoader | undefined = useMemo(() => {
    if (iconLoader && typeof iconLoader === 'function') {
      return createIconHandler(iconLoader)
    }

    if (parent && parent.props?.iconLoader) {
      return createIconHandler(parent.props.iconLoader)
    }

    if (iconLoaderUrl && typeof iconLoaderUrl === 'function') {
      return createIconHandler(undefined, iconLoaderUrl)
    }

    const iconPlugin = config?.plugins?.find((plugin) => {
      return (
        typeof (plugin as FormKitPlugin & { iconHandler: FormKitIconLoader })
          .iconHandler === 'function'
      )
    }) as (FormKitPlugin & { iconHandler: FormKitIconLoader }) | undefined

    return iconPlugin?.iconHandler
  }, [config?.plugins, iconLoader, iconLoaderUrl, parent])

  const [icon, setIcon] = useState<undefined | string>(() =>
    resolveSyncIcon(iconHandler, iconName),
  )

  useEffect(() => {
    if (!iconHandler || typeof iconHandler !== 'function' || !iconName) {
      setIcon(undefined)
      return
    }

    let isActive = true
    const iconOrPromise = iconHandler(iconName)
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
  }, [iconHandler, iconName])

  if (!iconName || !icon) {
    return null
  }

  const clickable = typeof onClick === 'function'
  const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (onKeyDown) onKeyDown(event)
    if (!event.defaultPrevented && clickable && isKeyboardClick(event)) {
      event.preventDefault()
      event.currentTarget.click()
    }
  }

  return createElement('span', {
    ...spanAttrs,
    className: ['formkit-icon', className].filter(Boolean).join(' '),
    role: role ?? (clickable ? 'button' : undefined),
    tabIndex: tabIndex ?? (clickable ? 0 : undefined),
    onClick,
    onKeyDown: clickable ? handleKeyDown : onKeyDown,
    dangerouslySetInnerHTML: { __html: icon },
  })
}

function isKeyboardClick(event: KeyboardEvent): boolean {
  return event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar'
}

export default FormKitIcon
