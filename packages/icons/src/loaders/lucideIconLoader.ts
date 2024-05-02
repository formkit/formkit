import type { genesisIcons } from '../index'
import { circle } from '../index'
import { kebab, camel } from '@formkit/utils'

/**
 * Attempts to fetch a remote icon from the lucide github repository.
 * @param iconName - The string name of the icon
 * @public
 */
export const lucideIconLoader =
  () =>
  async (iconName: string): Promise<string | undefined> => {
    iconName = camel(iconName)
    const remaps: Partial<typeof genesisIcons> & Record<string, string> = {
      add: 'plus',
      arrowDown: 'move-down',
      arrowUp: 'move-up',
      check: 'check',
      checkboxDecorator: 'check',
      down: 'chevron-down',
      close: 'x',
      color: 'palette',
      date: 'calendar',
      fastForward: 'fast-forward',
      fileItem: 'file',
      fileRemove: 'x',
      left: 'chevron-left',
      noFiles: 'file',
      rewind: 'rewind',
      right: 'chevron-right',
      select: 'chevron-down',
      spinner: 'loader-circle',
      star: 'star',
      trash: 'trash',
      dragHandle: 'grip-vertical',
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
      `https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/${name}.svg`
    )
    if (res.ok) {
      const icon = await res.text()
      if (icon.startsWith('<svg')) {
        return icon
      }
    }
    return undefined
  }
