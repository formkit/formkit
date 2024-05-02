import { FORMKIT_VERSION } from '@formkit/core'

/**
 * Attempts to fetch a remote icon from the FormKit CDN
 * @param iconName - The string name of the icon
 * @public
 */
export const formkitIconLoader =
  () =>
  async (iconName: string): Promise<string | undefined> => {
    const formkitVersion = FORMKIT_VERSION.startsWith('__')
      ? 'latest'
      : FORMKIT_VERSION

    const res = await fetch(
      `https://cdn.jsdelivr.net/npm/@formkit/icons@${formkitVersion}/dist/icons/${iconName}.svg`
    )
    if (res.ok) {
      const icon = await res.text()
      if (icon.startsWith('<svg')) {
        return icon
      }
    }
    return undefined
  }
