import { createSection } from '../src/createSection'
import { $if, $for, $attrs, $extend, $root, eachSection } from '../src/compose'
import { describe, expect, it, vi } from 'vitest'
import { FormKitSchemaDefinition, isDOM } from 'packages/core/src'

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
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
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
    // Should warn about the $root deprecation.
    expect(consoleSpy).toHaveBeenCalledTimes(1)
    consoleSpy.mockRestore()
  })
})

describe('eachSection', () => {
  it('can iterate over all nested schema', () => {
    const spy = vi.fn()

    const schema = $extend(createSection('foo', 'div')(), {
      children: [
        createSection('label', 'label')()({}),
        createSection('input', 'input')()({}),
        createSection('help', 'span')()({}),
      ],
    })({})
    const finalSchema = Array.isArray(schema) ? schema[0] : schema
    let iteration = 0

    eachSection(finalSchema as FormKitSchemaDefinition, (section) => {
      iteration++
      const sectionName = section.meta?.section
      if (iteration === 1) {
        expect(sectionName).toEqual('foo')
      }
      if (iteration === 2) {
        expect(sectionName).toEqual('label')
      }
      if (iteration === 3) {
        expect(sectionName).toEqual('input')
      }
      if (iteration === 4) {
        expect(sectionName).toEqual('help')
      }
      spy()
    })
    expect(spy).toHaveBeenCalledTimes(4)
  })

  it('stops iterating if the callback returns a value and stopOnCallbackReturn is set to true', () => {
    const spy = vi.fn()

    const schema = $extend(createSection('foo', 'div')(), {
      children: [
        createSection('label', 'label')()({}),
        createSection('input', 'input')()({}),
        createSection('help', 'span')()({}),
      ],
    })({})
    const finalSchema = Array.isArray(schema) ? schema[0] : schema

    eachSection(
      finalSchema as FormKitSchemaDefinition,
      (section) => {
        const sectionName = section.meta?.section
        spy()
        if (sectionName === 'label') {
          return true
        }
        return
      },
      true
    )
    expect(spy).toHaveBeenCalledTimes(2)
  })
})
