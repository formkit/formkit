/**
 * Attempts to fetch a remote icon from the FormKit CDN
 * @param iconName - The string name of the icon
 * @public
 */
export function materialIconLoader(
  style: 'baseline' | 'outline' | 'round' | 'sharp' | 'twotone' = 'baseline'
) {
  return async (iconName: string): Promise<string | undefined> => {
    const remaps: Record<string, string> = {
      down: 'chevron-down',
      checkboxDecorator: 'check',
    }
    const name = iconName in remaps ? remaps[iconName] : iconName
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
