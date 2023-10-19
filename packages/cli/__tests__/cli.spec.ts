import { describe, it, expect, vi } from 'vitest'
import { buildTheme } from '../src/buildTheme'
import chalk from 'chalk'
import { readFile } from 'fs/promises'
import { resolve } from 'pathe'

describe('buildTheme', () => {
  it('can build a local theme', () => {
    const consoleMock = vi
      .spyOn(console, 'log')
      .mockImplementation(() => undefined)
    buildTheme('my-theme')
    expect(consoleMock).toHaveBeenCalledWith(
      chalk.greenBright('Locating my-theme...')
    )
    consoleMock.mockRestore()
  })

  it('can generate a local theme', async () => {
    const consoleMock = vi
      .spyOn(console, 'log')
      .mockImplementation(() => undefined)
    await buildTheme('./packages/cli/__tests__/mocks/localTheme', {
      outFile: 'temp/formkit.theme.ts',
      format: 'ts',
    })

    expect(consoleMock).toHaveBeenNthCalledWith(
      1,
      chalk.greenBright('Locating ./packages/cli/__tests__/mocks/localTheme...')
    )
    expect(consoleMock).toHaveBeenNthCalledWith(
      2,
      chalk.greenBright('Theme file written to formkit.theme.ts')
    )
    const fileString = await readFile(
      resolve(process.cwd(), 'temp/formkit.theme.ts'),
      'utf-8'
    )
    expect(fileString).toMatchSnapshot()
  })

  it('can override variables in generated theme', async () => {
    await buildTheme('./packages/cli/__tests__/mocks/localTheme', {
      outFile: 'temp/formkit.theme.ts',
      format: 'ts',
      variables: 'border=border-6,spacing=10',
    })
    const fileString = await readFile(
      resolve(process.cwd(), 'temp/formkit.theme.ts'),
      'utf-8'
    )
    expect(fileString).toMatchSnapshot()
  })
})
