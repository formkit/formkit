import { createSection } from '../src/compose'

describe('section creator', () => {
  it('creates a section with slot and meta support', () => {
    expect(createSection('foo', 'div')()({})).toEqual({
      if: '$slots.foo',
      then: '$slots.foo',
      else: {
        meta: {
          section: 'foo',
        },
        $el: 'div',
        attrs: {
          class: '$classes.foo',
        },
      },
    })
  })
})
