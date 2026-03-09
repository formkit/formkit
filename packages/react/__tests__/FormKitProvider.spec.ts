import { FormKitNode } from '@formkit/core'
import { createElement } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  FormKit,
  FormKitLazyProvider,
  FormKitProvider,
  FormKitSchema,
  createInput,
  defaultConfig,
} from '../src'

describe('FormKitProvider (react)', () => {
  it('can use a custom FormKitProvider to inject config', async () => {
    const { container } = render(
      createElement(
        FormKitProvider,
        { config: defaultConfig() },
        createElement(FormKit as any, { type: 'text', name: 'foo' })
      )
    )

    await waitFor(() => {
      expect(container.querySelector('input')).toBeTruthy()
    })
  })

  it('can use FormKitSchema with a provider to render FormKit from library', async () => {
    const { container } = render(
      createElement(
        FormKitProvider,
        { config: defaultConfig() },
        createElement(FormKitSchema as any, {
          schema: [{ $formkit: 'text', name: 'foo' }],
          library: { FormKit },
        })
      )
    )

    await waitFor(() => {
      expect(container.querySelector('input')).toBeTruthy()
    })
  })

  it('can override parent configuration', async () => {
    const customLibrary = () => {
      /* noop */
    }

    customLibrary.library = (node: FormKitNode) => {
      if (node.props.type === 'text') {
        node.define({
          type: 'input',
          schema: [{ $el: 'h1', children: 'This is a custom text input' }],
        })
      }
    }

    const { container } = render(
      createElement(
        FormKitProvider,
        { config: defaultConfig() },
        createElement(
          FormKitProvider,
          { config: { plugins: [customLibrary] } },
          createElement(FormKit as any, { type: 'text', name: 'foo' })
        )
      )
    )

    await waitFor(() => {
      expect(container.querySelector('h1')?.textContent).toBe(
        'This is a custom text input'
      )
    })

    expect(container.querySelector('input')).toBeNull()
  })

  it('does not interfere when no config is provided', async () => {
    const { container } = render(
      createElement(
        FormKitProvider,
        { config: defaultConfig() },
        createElement(
          FormKitProvider,
          null,
          createElement(FormKit as any, { type: 'text', name: 'foo' })
        )
      )
    )

    await waitFor(() => {
      expect(container.querySelector('input.formkit-input')).toBeTruthy()
    })
  })

  it('can use a custom FormKitLazyProvider to inject default config', async () => {
    const { container } = render(
      createElement(
        FormKitLazyProvider,
        null,
        createElement(FormKit as any, { type: 'text', name: 'foo' })
      )
    )

    await waitFor(() => {
      expect(container.querySelector('input')).toBeTruthy()
    })
  })

  it('can sub-render a FormKit component that is not globally registered', async () => {
    const library = () => {
      /* noop */
    }

    library.library = (node: FormKitNode) => {
      if (node.props.type === 'sub-render') {
        node.define(
          createInput({
            $cmp: 'FormKit',
            props: {
              type: 'child',
            },
          })
        )
      }
      if (node.props.type === 'child') {
        node.define(
          createInput({
            $el: 'h1',
            children: 'I am a child',
          })
        )
      }
    }

    render(
      createElement(
        FormKitProvider,
        { config: { plugins: [library] } },
        createElement(FormKit as any, { type: 'sub-render' })
      )
    )

    await waitFor(() => {
      expect(screen.getByText('I am a child')).toBeTruthy()
    })
  })

  it('can pass attributes through to child elements', () => {
    render(
      createElement(
        FormKitProvider,
        {
          className: 'foo',
          'data-test-id': 'bar',
        } as any,
        createElement('div', { id: 'provider-child' })
      )
    )

    const child = document.querySelector('#provider-child')
    expect(child?.getAttribute('class')).toContain('foo')
    expect(child?.getAttribute('data-test-id')).toBe('bar')
  })

  it('passes attributes through to lazy provider children when config already exists', async () => {
    render(
      createElement(
        FormKitProvider,
        { config: defaultConfig() },
        createElement(
          FormKitLazyProvider,
          { className: 'lazy-pass' } as any,
          createElement('button', { id: 'lazy-child', onClick: () => undefined }, 'test')
        )
      )
    )

    fireEvent.click(document.querySelector('#lazy-child') as HTMLButtonElement)
    await waitFor(() => {
      expect(document.querySelector('#lazy-child')?.getAttribute('class')).toContain(
        'lazy-pass'
      )
    })
  })
})
