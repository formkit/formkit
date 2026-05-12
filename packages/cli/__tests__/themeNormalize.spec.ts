import { describe, expect, it } from 'vitest'
import { createHash } from 'crypto'
import { normalizeGeneratedTheme } from '../src/themeNormalize'

describe('normalizeGeneratedTheme', () => {
  it('keeps Regenesis dark disabled submit borders aligned with the disabled background', () => {
    const source = `/**
  * @checksum - old-checksum
  * @variables -
  * @theme - regenesis
  **/
const classes = {
  "submit__input": {
    "dark:disabled:border-neutral-100": true,
    "dark:disabled:bg-neutral-500": true
  }
}
`

    const normalized = normalizeGeneratedTheme('regenesis', source)
    expect(normalized).toContain('"dark:disabled:border-neutral-500": true')
    expect(normalized).not.toContain('dark:disabled:border-neutral-100')

    const checksum = normalized.substring(
      normalized.indexOf('@checksum -') + 12,
      normalized.indexOf('\n', normalized.indexOf('@checksum -'))
    )
    const codeWithoutChecksum = normalized.replace(
      `* @checksum - ${checksum}`,
      '* @checksum -'
    )
    expect(createHash('sha256').update(codeWithoutChecksum).digest('hex')).toBe(
      checksum
    )
  })

  it('does not alter non-Regenesis theme output', () => {
    const source = `/**
  * @checksum - old-checksum
  * @variables -
  * @theme - other
  **/
"dark:disabled:border-neutral-100": true
`

    expect(normalizeGeneratedTheme('other', source)).toBe(source)
  })
})
