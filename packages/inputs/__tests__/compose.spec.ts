import { composable } from '../src/compose'
import { FormKitExtendableSchemaRoot } from '@formkit/core'

describe('composable creator', () => {
  it('does not deeply nest objects', () => {
    const foo = composable('foo', {
      $el: 'div',
      attrs: { 'data-foo': 'true' },
    })
    expect(
      foo({}, [
        {
          $el: 'input',
          attrs: { 'data-index': 'first' },
        },
      ])
    ).toStrictEqual({
      if: '$slots.foo',
      then: '$slots.foo',
      else: [
        {
          $el: 'div',
          attrs: { 'data-foo': 'true' },
          children: [
            {
              $el: 'input',
              attrs: { 'data-index': 'first' },
            },
          ],
        },
      ],
    })
    expect(
      foo({}, [
        {
          $el: 'input',
          attrs: { 'data-index': 'second', min: '10' },
        },
      ])
    ).toStrictEqual({
      if: '$slots.foo',
      then: '$slots.foo',
      else: [
        {
          $el: 'div',
          attrs: { 'data-foo': 'true' },
          children: [
            {
              $el: 'input',
              attrs: { 'data-index': 'second', min: '10' },
            },
          ],
        },
      ],
    })
  })

  it('does not allow deeply linked objects', () => {
    const outer = composable('outer', () => ({
      $el: 'div',
    }))
    const inner = composable('inner', () => ({
      $el: 'div',
    }))
    const input = composable('input', () => ({
      $el: 'input',
    }))
    const text: FormKitExtendableSchemaRoot = (ext) => [
      outer(ext.outer, [inner(ext.inner, [input(ext.input)])]),
    ]
    const modified = () => {
      return text({ inner: { $el: 'h1' } })
    }
    expect(modified()).toStrictEqual([
      {
        if: '$slots.outer',
        then: '$slots.outer',
        else: [
          {
            $el: 'div',
            children: [
              {
                if: '$slots.inner',
                then: '$slots.inner',
                else: [
                  {
                    $el: 'h1',
                    children: [
                      {
                        if: '$slots.input',
                        then: '$slots.input',
                        else: [
                          {
                            $el: 'input',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ])
    expect(text({})).toStrictEqual([
      {
        if: '$slots.outer',
        then: '$slots.outer',
        else: [
          {
            $el: 'div',
            children: [
              {
                if: '$slots.inner',
                then: '$slots.inner',
                else: [
                  {
                    $el: 'div',
                    children: [
                      {
                        if: '$slots.input',
                        then: '$slots.input',
                        else: [
                          {
                            $el: 'input',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ])
  })
})
