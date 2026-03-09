import { createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { FormKitValidationRule } from '@formkit/validation'
import { getNode, FormKitPlugin } from '@formkit/core'
import { token } from '@formkit/utils'
import { FormKit, defaultConfig } from '../src'
import { renderWithFormKit } from './helpers'

describe('defaultConfig (react)', () => {
  it('allows rule augmentation', async () => {
    const monday: FormKitValidationRule = ({ value }) => value === 'monday'

    renderWithFormKit(
      createElement(FormKit as any, {
        id: 'monday',
        value: 'foobar',
        validation: 'monday',
      }),
      defaultConfig({ rules: { monday } })
    )

    const node = getNode('monday')!
    expect(node.store).toHaveProperty('rule_monday')
    node.input('monday', false)
    await new Promise((r) => setTimeout(r, 5))
    expect(node.store).not.toHaveProperty('rule_monday')
  })

  it('allows plugin augmentation', () => {
    const newPlugin: FormKitPlugin = vi.fn((node) =>
      node.hook.input((value) => `${value}.`)
    )

    renderWithFormKit(
      createElement(FormKit as any, {
        id: 'tuesday',
        value: 'foobar',
      }),
      defaultConfig({ plugins: [newPlugin] })
    )

    expect(newPlugin).toHaveBeenCalledTimes(1)
    const node = getNode('tuesday')!
    expect(node.value).toBe('foobar.')
  })

  it('allows input augmentation', () => {
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        type: 'fooey',
      }),
      defaultConfig({
        inputs: {
          fooey: {
            type: 'input',
            schema: [{ $el: 'h1', children: 'Fooey world' }],
          },
        },
      })
    )

    expect(container.innerHTML).toBe('<h1>Fooey world</h1>')
  })

  it('allows single message overrides', () => {
    const t = token()
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        name: t,
        type: 'text',
        validation: 'required',
        validationVisibility: 'live',
      }),
      defaultConfig({
        messages: {
          en: {
            validation: {
              required({ name }) {
                return `${name} incomplete`
              },
            },
          },
        },
      })
    )

    expect(container.textContent).toContain(`${t} incomplete`)
  })

  it('allows the locale to be defined at root options', () => {
    const t = token()
    const required = token()
    const { container } = renderWithFormKit(
      createElement(FormKit as any, {
        name: t,
        type: 'text',
        validation: 'required',
        validationVisibility: 'live',
      }),
      defaultConfig({
        locales: {
          xx: {
            ui: {},
            validation: {
              required,
            },
          },
        },
        locale: 'xx',
      })
    )

    expect(container.innerHTML).toContain(required)
  })
})
