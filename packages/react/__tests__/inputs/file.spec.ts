import { getNode } from '@formkit/core'
import { token } from '@formkit/utils'
import { createElement } from 'react'
import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FormKit, defaultConfig } from '../../src'
import { renderWithFormKit } from '../helpers'

describe('file inputs (react)', () => {
  it('can rehydrate a file input using an array', () => {
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: 'file',
        id: 'super-unique-id-2',
        value: [{ name: 'test.pdf' }],
      }),
      defaultConfig()
    )

    expect(container.textContent).toContain('test.pdf')
    expect(container.querySelector('input[type="file"]')).toBeTruthy()
  })

  it('applies data-has-multiple when multiple files are attached', () => {
    const id = `a${token()}`
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: 'file',
        id,
        value: [{ name: 'test.pdf' }, { name: 'other.pdf' }],
      }),
      defaultConfig()
    )

    expect(container.querySelector('[data-has-multiple="true"]')).toBeTruthy()
  })

  it('can rehydrate a file from inside a form value', () => {
    const id = 'super-unique-id'
    const { container } = renderWithFormKit(
      createElement(
        FormKit as any,
        { type: 'form', id, value: { file: [{ name: 'test.jpg' }] } },
        createElement(FormKit as any, {
          type: 'file',
          name: 'file',
        })
      ),
      defaultConfig()
    )

    expect(container.textContent).toContain('test.jpg')
  })

  it('can override class for file name', () => {
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: 'file',
        name: 'file',
        value: [{ name: 'test.jpg' }],
        fileNameClass: 'my-name',
      }),
      defaultConfig()
    )

    const fileName = container.querySelector('.formkit-file-name')
    expect(fileName).toBeTruthy()
    expect(fileName?.getAttribute('class')).toContain('my-name')
  })

  it('has a default no-files label', () => {
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: 'file',
        name: 'file',
      }),
      defaultConfig()
    )

    expect(container.querySelector('.formkit-no-files')).toBeTruthy()
  })

  it('can be reset to an empty file uploader', async () => {
    const id = token()

    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        id,
        type: 'file',
        name: 'file',
      }),
      defaultConfig()
    )

    expect(container.querySelector('.formkit-no-files')).toBeTruthy()

    getNode(id)!.reset()

    await waitFor(() => {
      expect(container.querySelector('.formkit-no-files')).toBeTruthy()
    })
  })

  it('always renders data-multiple=true when multiple attribute exists', () => {
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: 'file',
        name: 'file',
        multiple: true,
      }),
      defaultConfig()
    )

    expect(container.querySelector('.formkit-outer')?.getAttribute('data-multiple')).toBe(
      'true'
    )
  })
})
