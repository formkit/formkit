import { createElement, useState } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
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

  describe('named slots on $cmp nodes (#190)', () => {
    afterEach(cleanup)
    function Card(props: {
      header?: (p: Record<string, any>) => any
      footer?: (p: Record<string, any>) => any
      children?: any
    }) {
      const [count, setCount] = useState(1)
      return createElement(
        'div',
        null,
        createElement(
          'header',
          { 'data-testid': 'header' },
          props.header ? props.header({ title: 'Card title', count }) : null
        ),
        createElement('main', { 'data-testid': 'main' }, props.children),
        createElement(
          'footer',
          { 'data-testid': 'footer' },
          props.footer ? props.footer({ count }) : null
        ),
        createElement('button', { onClick: () => setCount(count + 1) }, 'inc')
      )
    }

    it('passes named slots as render-props that receive slot props', () => {
      const q = render(
        createElement(FormKitSchema, {
          data: { user: 'Jane' },
          library: { Card },
          schema: [
            {
              $cmp: 'Card',
              children: [{ $el: 'p', children: 'Body' }],
              slots: {
                header: [
                  { $el: 'h2', children: '$: $title + " for " + $user' },
                ],
                footer: '$: "Count: " + $count',
              },
            },
          ],
        })
      )
      expect(q.getByTestId('header').textContent).toBe(
        'Card title for Jane'
      )
      expect(q.getByTestId('main').textContent).toBe('Body')
      expect(q.getByTestId('footer').textContent).toBe('Count: 1')
    })

    it('re-renders slot content when slot props or data change', () => {
      function Host() {
        const [user, setUser] = useState('Jane')
        return createElement(
          'div',
          null,
          createElement('button', { onClick: () => setUser('Bob') }, 'swap'),
          createElement(FormKitSchema, {
            data: { user },
            library: { Card },
            schema: [
              {
                $cmp: 'Card',
                slots: {
                  header: '$user',
                  footer: {
                    if: '$count > 1',
                    then: 'Many',
                    else: '$: "Count: " + $count',
                  },
                },
              },
            ],
          })
        )
      }
      const q = render(createElement(Host))
      expect(q.getByTestId('header').textContent).toBe('Jane')
      expect(q.getByTestId('footer').textContent).toBe('Count: 1')
      fireEvent.click(q.getByText('inc'))
      expect(q.getByTestId('footer').textContent).toBe('Many')
      fireEvent.click(q.getByText('swap'))
      expect(q.getByTestId('header').textContent).toBe('Bob')
    })

    it('prefers slots.default over children', () => {
      const q = render(
        createElement(FormKitSchema, {
          library: { Card },
          schema: [
            {
              $cmp: 'Card',
              children: 'from children',
              slots: { default: 'from slots' },
            },
          ],
        })
      )
      expect(q.getByTestId('main').textContent).toBe('from slots')
    })
  })
})
