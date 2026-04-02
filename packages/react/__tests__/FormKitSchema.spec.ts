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
})
