import {
  createSection,
  $if,
  $for,
  $attrs,
  $extend,
  $root,
} from '../src/compose'
import { describe, expect, it } from 'vitest'

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

describe('composable helpers', () => {
  it('can apply an if statement to a section using the $if() function', () => {
    expect($if('$: true', createSection('foo', 'div')())({})).toEqual({
      if: '$: true',
      then: {
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
      },
    })
  })

  it('can apply an for statement to a section using the $for() function', () => {
    expect($for('item', '$items', createSection('foo', 'div')())({})).toEqual({
      if: '$slots.foo',
      then: '$slots.foo',
      else: {
        meta: {
          section: 'foo',
        },
        $el: 'div',
        for: ['item', '$items'],
        attrs: {
          class: '$classes.foo',
        },
      },
    })
  })

  it('can apply some attrs to a section using the $attrs() function', () => {
    expect(
      $attrs(
        {
          'data-foo': 'bar',
          'foo-data': 'bar',
        },
        createSection('foo', 'div')()
      )({})
    ).toEqual({
      if: '$slots.foo',
      then: '$slots.foo',
      else: {
        meta: {
          section: 'foo',
        },
        $el: 'div',
        attrs: {
          class: '$classes.foo',
          'data-foo': 'bar',
          'foo-data': 'bar',
        },
      },
    })
  })

  it('can extend a section by using the $extend() function', () => {
    expect($extend(createSection('foo', 'div')(), { $el: 'h1' })({})).toEqual({
      if: '$slots.foo',
      then: '$slots.foo',
      else: {
        meta: {
          section: 'foo',
        },
        $el: 'h1',
        attrs: {
          class: '$classes.foo',
        },
      },
    })
  })

  it('can transform a section into a root section using the $root() function', () => {
    expect($root(createSection('foo', 'div')())({})).toEqual([
      {
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
      },
    ])
  })
})
