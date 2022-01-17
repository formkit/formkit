import { composable } from '../src/compose'

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
})
