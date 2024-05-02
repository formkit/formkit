import type { genesisIcons } from '../index'
import { dragHandle } from '../index'
import { kebab, camel } from '@formkit/utils'

/**
 * Attempts to fetch a remote icon from the ionic-icons project via cdn.
 * @param iconName - The string name of the icon
 * @public
 */
export function ionIconLoader(version: string = 'latest') {
  return async (iconName: string): Promise<string | undefined> => {
    iconName = camel(iconName)
    const remaps: Partial<typeof genesisIcons> & Record<string, string> = {
      add: 'add-outline',
      arrowDown: 'arrow-down-outline',
      arrowUp: 'arrow-up-outline',
      check: 'checkmark-outline',
      checkboxDecorator: 'checkmark-outline',
      down: 'chevron-down-outline',
      close: 'close-outline',
      color: 'color-palette-outline',
      date: 'calendar-clear-icon',
      fastForward: 'play-forward-outline',
      fileItem: 'document-outline',
      fileRemove: 'close-outline',
      left: 'chevron-left-outline',
      noFiles: 'document-outline',
      rewind: 'play-back-outline',
      right: 'chevron-right-outline',
      select: 'chevron-down-outline',
      spinner: 'reload-outline',
      star: 'star-outline',
      trash: 'trash',
      radioDecorator: 'ellipse',
      circle: 'ellipse',
    }
    if (iconName === 'dragHandle') return dragHandle
    const name = kebab(
      (iconName in remaps
        ? remaps[iconName as keyof typeof genesisIcons]
        : iconName) ?? ''
    )
    const res = await fetch(
      `https://cdn.jsdelivr.net/npm/ionicons@${version}/dist/svg/${name}.svg`
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
