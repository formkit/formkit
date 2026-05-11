import { createHash } from 'crypto'

export function normalizeGeneratedTheme(themeName: string, code: string): string {
  if (themeName !== 'regenesis' && themeName !== 'regenesis-tw3') {
    return code
  }

  const normalized = code.replace(
    /"dark:disabled:border-neutral-100": true/g,
    '"dark:disabled:border-neutral-500": true'
  )

  return normalized === code
    ? code
    : updateGeneratedThemeChecksum(normalized)
}

function updateGeneratedThemeChecksum(code: string): string {
  const checksum = extractChecksum(code)
  const codeWithoutChecksum = code.replace(
    `* @checksum - ${checksum}`,
    '* @checksum -'
  )
  const newChecksum = createHash('sha256')
    .update(codeWithoutChecksum)
    .digest('hex')
  return code.replace(
    `* @checksum - ${checksum}`,
    `* @checksum - ${newChecksum}`
  )
}

function extractChecksum(theme: string): string {
  const checksumStart = theme.indexOf('@checksum -')
  if (checksumStart === -1) {
    throw new Error('Unable to find checksum in theme file.')
  }
  return theme.substring(checksumStart + 12, theme.indexOf('\n', checksumStart))
}
