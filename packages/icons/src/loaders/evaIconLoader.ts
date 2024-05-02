import type { genesisIcons } from '../index'
import { circle } from '../index'
import { camel, kebab } from '@formkit/utils'
/**
 * Attempts to fetch a remote icon from the eva-icons project via cdn.
 * @param iconName - The string name of the icon
 * @public
 */
export function evaIconLoader(style: string = 'outline') {
  return async (iconName: string): Promise<string | undefined> => {
    iconName = camel(iconName)
    const remaps: Partial<typeof genesisIcons> & Record<string, string> = {
      add: 'plus-outline',
      arrowDown: 'arrow-downward-outline',
      arrowUp: 'arrow-upward-outline',
      check: 'checkmark-outline',
      checkboxDecorator: 'checkmark-outline',
      down: 'chevron-down-outline',
      close: 'close-outline',
      color: 'color-palette-outline',
      date: 'calendar-outline',
      dragHandle: 'keypad-outline',
      fastForward: 'rewind-right-outline',
      fileItem: 'file-outline',
      fileRemove: 'close-outline',
      left: 'chevron-left-outline',
      noFiles: 'file-outline',
      rewind: 'rewind-left-outline',
      right: 'chevron-right-outline',
      select: 'chevron-down-outline',
      spinner: 'loader-outline',
      star: 'star-outline',
      trash: 'trash-outline',
    }
    if (iconName === 'radioDecorator' || iconName === 'circle') {
      return circle
    }
    const name = kebab(
      (iconName in remaps
        ? remaps[iconName as keyof typeof genesisIcons]
        : iconName) ?? ''
    )
    const res = await fetch(
      `https://cdn.jsdelivr.net/npm/eva-icons@latest/${style}/svg/${name}.svg`
    )
    if (res.ok) {
      const icon = await res.text()
      if (icon.startsWith('<svg')) {
        return icon
      }
    }
    return undefined
  }
}
