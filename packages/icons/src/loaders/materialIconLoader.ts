import type { genesisIcons } from '../index'
import { circle } from '../index'
import { kebab, camel } from '@formkit/utils'

/**
 * Attempts to fetch a remote icon from the material-icon project via cdn.
 * @param iconName - The string name of the icon
 * @public
 */
export function materialIconLoader(
  style: 'baseline' | 'outline' | 'round' | 'sharp' | 'twotone' = 'baseline'
) {
  return async (iconName: string): Promise<string | undefined> => {
    iconName = camel(iconName)
    const remaps: Partial<typeof genesisIcons> & Record<string, string> = {
      add: 'add',
      arrowDown: 'arrow-downward',
      arrowUp: 'arrow-upward',
      check: 'check',
      checkboxDecorator: 'check',
      down: 'expand-more',
      close: 'close',
      color: 'palette',
      date: 'calendar-today',
      fastForward: 'fast-forward',
      fileItem: 'draft',
      fileRemove: 'close',
      left: 'chevron-left',
      noFiles: 'draft',
      rewind: 'fast-rewind',
      right: 'chevron-right',
      select: 'expand-more',
      spinner: 'rotate-right',
      star: 'star',
      trash: 'delete',
      dragHandle: 'drag-indicator',
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
      `https://cdn.jsdelivr.net/npm/@material-icons/svg@latest/svg/${name}/${style}.svg`
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
