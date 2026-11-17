import { describe, it, expect, vi } from 'vitest'
import { readFile } from 'fs/promises'
import { mkdirSync } from 'fs'
import { resolve } from 'pathe'
import { createHash } from 'crypto'
import {
  normalizePrefix,
  prefixClass,
  extractThemePrefix,
} from '../src/themePrefix'
import { buildTheme, extractThemeData } from '../src/theme'

describe('prefixClass (#1157)', () => {
  it('prefixes Tailwind v4 classes as a leading variant', () => {
    expect(prefixClass('bg-red-500', 'tw', 4)).toBe('tw:bg-red-500')
    expect(prefixClass('hover:dark:bg-red-500', 'tw', 4)).toBe(
      'tw:hover:dark:bg-red-500'
    )
    expect(prefixClass('tw:flex', 'tw', 4)).toBe('tw:flex')
  })

  it('prefixes Tailwind v3 utilities after variants and modifiers', () => {
    expect(prefixClass('bg-red-500', 'tw-', 3)).toBe('tw-bg-red-500')
    expect(prefixClass('hover:-mt-2', 'tw-', 3)).toBe('hover:-tw-mt-2')
    expect(prefixClass('md:!font-bold', 'tw-', 3)).toBe('md:!tw-font-bold')
    expect(prefixClass('group', 'tw-', 3)).toBe('tw-group')
    expect(prefixClass('group-data-[invalid]:border-red-500', 'tw-', 3)).toBe(
      'group-data-[invalid]:tw-border-red-500'
    )
    expect(prefixClass('[&>svg]:w-4', 'tw-', 3)).toBe('[&>svg]:tw-w-4')
    expect(prefixClass('bg-[url(a:b)]', 'tw-', 3)).toBe('tw-bg-[url(a:b)]')
  })

  it('never prefixes formkit-* classes', () => {
    expect(prefixClass('formkit-label', 'tw', 4)).toBe('formkit-label')
    expect(prefixClass('formkit-invalid:text-red', 'tw-', 3)).toBe(
      'formkit-invalid:text-red'
    )
  })

  it('validates prefixes', () => {
    expect(normalizePrefix('tw:', 4)).toBe('tw')
    expect(() => normalizePrefix('tw-', 4)).toThrow()
    expect(normalizePrefix('tw-', 3)).toBe('tw-')
  })
})

describe('buildTheme --prefix', () => {
  it('prefixes every class, records the prefix, and keeps a valid checksum', async () => {
    mkdirSync(resolve(process.cwd(), 'temp'), { recursive: true })
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    await buildTheme({
      theme: './packages/cli/__tests__/mocks/localTheme.ts',
      outFile: 'temp/formkit.theme.prefixed.ts',
      format: 'ts',
      prefix: 'tw',
    })
    const code = await readFile(
      resolve(process.cwd(), 'temp/formkit.theme.prefixed.ts'),
      'utf-8'
    )
    expect(extractThemePrefix(code)).toBe('tw')
    const body = code.slice(code.indexOf('\nconst classes'))
    const keys = [...body.matchAll(/^ {4}"([^"]+)": (?:true|false)/gm)].map(
      (m) => m[1]
    )
    expect(keys.length).toBeGreaterThan(0)
    expect(keys.filter((k) => !k.startsWith('tw:'))).toEqual([])
    // The checksum must match so `formkit theme` edit mode doesn't think the
    // file was hand-edited.
    const [checksum] = extractThemeData(code)
    const hash = createHash('sha256')
      .update(code.replace(`* @checksum - ${checksum}`, '* @checksum -'))
      .digest('hex')
    expect(hash).toBe(checksum)
  })
})
