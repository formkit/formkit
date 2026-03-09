import { createElement, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { FormKitMiddleware } from '../../core/src/dispatcher'
import { FormKitNode, getNode } from '@formkit/core'
import { token } from '@formkit/utils'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { FormKit, defaultConfig } from '../src'
import { renderWithFormKit } from './helpers'

describe('plugins (react)', () => {
  it('can define props in a standard plugin', () => {
    const customPlugin = (node: FormKitNode) => {
      node.addProps(['fooBar'])
      expect(node.props.fooBar).toBe('123')
    }

    const props: Record<string, unknown> = {
      type: 'text',
      plugins: [customPlugin],
      'foo-bar': '123',
    }

    const { container } = renderWithFormKit(
      createElement(FormKit as any, props),
      defaultConfig()
    )

    expect(container.querySelector('[foo-bar]')).toBeNull()
  })

  it('can add props after the node has already been created', async () => {
    const id = token()
    const customPlugin = (node: FormKitNode) => {
      node.addProps(['fooBar'])
      expect(node.props.fooBar).toBe('123')
    }

    const props: Record<string, unknown> = {
      type: 'text',
      id,
      'foo-bar': '123',
    }

    const { container } = renderWithFormKit(
      createElement(FormKit as any, props),
      defaultConfig()
    )

    expect(container.querySelector('[foo-bar]')).not.toBeNull()
    getNode(id)?.use(customPlugin)

    await waitFor(() => {
      expect(container.querySelector('[foo-bar]')).toBeNull()
    })
  })

  it('can directly modify node.prop.attrs via hooks and props', async () => {
    const id = token()
    const changeAttrs = (node: FormKitNode) => {
      node.hook.prop(({ prop, value }, next) => {
        if (prop === 'placeholder') {
          value = 'should be this'
        }
        return next({ prop, value })
      })
      node.props.placeholder = node.props.placeholder
      node.props.label = 'this label'
    }

    renderWithFormKit(
      createElement(FormKit as any, {
        placeholder: 'should not be this',
        type: 'select',
        label: 'not this label',
        options: ['a', 'b'],
        id,
        plugins: [changeAttrs],
      }),
      defaultConfig()
    )

    await waitFor(() => {
      expect(getNode(id)!.props.placeholder).toBe('should be this')
    })

    expect(screen.getByText('this label')).toBeTruthy()
    expect(
      document.querySelector('option[data-is-placeholder]')?.textContent
    ).toBe('should be this')
  })

  it('can change a controlled value via plugin hook on init', async () => {
    const inputHook: FormKitMiddleware = vi.fn((_value, next) => {
      return next('5')
    })

    const id = token()

    function Controlled() {
      const [value, setValue] = useState('2')
      const setToFive = (node: FormKitNode) => {
        node.hook.input(inputHook)
      }

      return createElement(
        'div',
        null,
        createElement(FormKit as any, {
          id,
          type: 'text',
          modelValue: value,
          onUpdateModelValue: setValue,
          plugins: [setToFive],
        }),
        createElement('h1', null, value)
      )
    }

    const { container } = renderWithFormKit(
      createElement(Controlled),
      defaultConfig()
    )

    await waitFor(() => {
      expect(inputHook).toHaveBeenCalled()
      expect(getNode(id)!.value).toBe('5')
      expect((container.querySelector('input') as HTMLInputElement).value).toBe(
        '5'
      )
      expect(screen.getByText('5')).toBeTruthy()
    })

    const input = container.querySelector('input') as HTMLInputElement
    fireEvent.input(input, { target: { value: 'bar' } })

    await waitFor(() => {
      expect(getNode(id)!.value).toBe('5')
      expect((container.querySelector('h1') as HTMLHeadingElement).textContent).toBe(
        '5'
      )
    })
  })
})
