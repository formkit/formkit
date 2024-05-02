import type { genesisIcons } from '../index'
import { circle, dragHandle } from '../index'
import { kebab, camel } from '@formkit/utils'

/**
 * Attempts to fetch a remote icon from the heroicons via cdn.
 * @param iconName - The string name of the icon
 * @public
 */
export function heroIconLoader(
  size: '24' | '20' | '16' = '24',
  style: 'outline' | 'solid' = 'outline'
) {
  return async (iconName: string): Promise<string | undefined> => {
    iconName = camel(iconName)
    const remaps: Partial<typeof genesisIcons> & Record<string, string> = {
      add: 'plus',
      arrowDown: 'arrow-down',
      arrowUp: 'arrow-up',
      check: 'check',
      checkboxDecorator: 'check',
      down: 'chevron-down',
      close: 'x-mark',
      color: 'paint-brush',
      date: 'calendar',
      fastForward: 'forward',
      fileItem: 'document',
      fileRemove: 'x-mark',
      left: 'chevron-left',
      noFiles: 'document',
      rewind: 'backward',
      right: 'chevron-right',
      select: 'chevron-down',
      spinner: 'arrow-path',
      star: 'star-outline',
      trash: 'trash',
    }
    if (iconName === 'radioDecorator' || iconName === 'circle') {
      return circle
    }
    if (iconName === 'dragHandle') return dragHandle
    const name = kebab(
      (iconName in remaps
        ? remaps[iconName as keyof typeof genesisIcons]
        : iconName) ?? ''
    )
    const res = await fetch(
      `https://cdn.jsdelivr.net/npm/heroicons/${size}/${style}/${name}.svg`
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
