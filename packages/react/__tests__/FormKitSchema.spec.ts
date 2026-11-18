import { createElement, useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FormKitSchema } from '../src/FormKitSchema'

describe('FormKitSchema (react)', () => {
  it('renders and updates with data changes', () => {
    function Host() {
      const [value, setValue] = useState('a')
      return createElement(
        'div',
        null,
        createElement(
          'button',
          { onClick: () => setValue('b') },
          'swap'
        ),
        createElement(FormKitSchema, {
          data: { value },
          schema: [{ $el: 'h1', children: '$value' }],
        })
      )
    }

    render(createElement(Host))
    expect(screen.getByText('a')).toBeTruthy()
    fireEvent.click(screen.getByText('swap'))
    expect(screen.getByText('b')).toBeTruthy()
  })

  it('parses nested arrays in props prefixed with __deep__ (#1506)', () => {
    function Items(props: { items: Array<{ label: string; off?: boolean }> }) {
      return createElement(
        'ul',
        null,
        props.items.map((item, i) =>
          createElement('li', { key: i, 'data-off': String(!!item.off) }, item.label)
        )
      )
    }
    function Host() {
      const [off, setOff] = useState(true)
      return createElement(
        'div',
        null,
        createElement('button', { onClick: () => setOff(false) }, 'toggle'),
        createElement(FormKitSchema, {
          data: { off, plain: '$10' },
          library: { Items },
          schema: [
            {
              $cmp: 'Items',
              props: {
                __deep__items: [
                  { label: 'static' },
                  { label: '$: "dynamic-" + $off', off: '$off' },
                ],
              },
            },
            { $cmp: 'Items', props: { items: [{ label: '$plain' }] } },
          ],
        })
      )
    }
    render(createElement(Host))
    expect(screen.getByText('dynamic-true').getAttribute('data-off')).toBe('true')
    expect(screen.getByText('static')).toBeTruthy()
    // Without the prefix, array members are not parsed
    expect(screen.getByText('$plain')).toBeTruthy()
    fireEvent.click(screen.getByText('toggle'))
    expect(screen.getByText('dynamic-false').getAttribute('data-off')).toBe('false')
  })
})
