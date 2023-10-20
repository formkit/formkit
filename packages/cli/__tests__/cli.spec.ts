import { describe, it, expect, vi } from 'vitest'
import { buildTheme } from '../src/buildTheme'
import chalk from 'chalk'
import { readFile } from 'fs/promises'
import { resolve } from 'pathe'
import { createNode, FormKitContext } from '@formkit/core'

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

  it('returns the correct classes for a given input section', async () => {
    await buildTheme('./packages/cli/__tests__/mocks/localTheme', {
      outFile: 'temp/formkit.theme.ts',
      format: 'ts',
      variables: 'spacing=5',
    })
    // @ts-ignore
    const { rootClasses } = await import(
      resolve(process.cwd(), 'temp/formkit.theme.ts')
    )
    const node = createNode({
      type: 'input',
      props: { type: 'text', rootClasses, family: 'text' },
    })

    // @ts-ignore
    expect(node.props.rootClasses!('outer', node)).toEqual({
      'border-green-300': true,
      'mb-5': true,
      'ml-80': true,
      'mr-10': true,
      'mt-2': true,
      'text-green-300': true,
    })
  })
})
