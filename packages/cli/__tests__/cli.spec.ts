import { describe, it, expect, vi, beforeAll } from 'vitest'
import { buildTheme, extractThemeData } from '../src/theme'
import chalk from 'chalk'
import { readFile } from 'fs/promises'
import { mkdirSync } from 'fs'
import { resolve } from 'pathe'
import { createNode } from '@formkit/core'

beforeAll(() => {
  mkdirSync(resolve(process.cwd(), 'temp'), { recursive: true })
})

describe('buildTheme', () => {
  it('can generate a local theme', async () => {
    const consoleMock = vi
      .spyOn(console, 'log')
      .mockImplementation(() => undefined)
    await buildTheme({
      theme: './packages/cli/__tests__/mocks/localTheme.ts',
      outFile: 'temp/formkit.theme.ts',
      format: 'ts',
    })

    expect(consoleMock).toHaveBeenNthCalledWith(
      1,
      chalk.greenBright(
        'Locating ./packages/cli/__tests__/mocks/localTheme.ts...'
      )
    )
    const fileString = await readFile(
      resolve(process.cwd(), 'temp/formkit.theme.ts'),
      'utf-8'
    )
    expect(fileString).toMatchSnapshot()
  })

  it('can override variables in generated theme', async () => {
    await buildTheme({
      theme: './packages/cli/__tests__/mocks/localTheme.ts',
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
    await buildTheme({
      theme: './packages/cli/__tests__/mocks/localTheme.ts',
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
      'formkit-outer': true,
      'mb-5': true,
      'ml-80': true,
      'mr-10': true,
      'mt-2': true,
      'text-green-300': true,
    })
  })
})

describe('extractThemeData', () => {
  it('can extract basic details about a given theme', async () => {
    await buildTheme({
      theme: './packages/cli/__tests__/mocks/localTheme.ts',
      outFile: 'temp/formkit.theme.ts',
      format: 'ts',
      variables: 'spacing=5',
    })
    const fileString = await readFile(
      resolve(process.cwd(), 'temp/formkit.theme.ts'),
      'utf-8'
    )
    const themeData = extractThemeData(fileString)
    expect(themeData).toEqual([
      '9902ad56008296f4db97332febf34b6c1e82159dcb57f81f30198bca7c3ebe92',
      'spacing=5',
      'simple',
    ])
  })
})
