import { createNode } from '@formkit/core'
import formatsOptions from '../src/features/options'
import { createLibraryPlugin } from '../src/index'

describe('options', () => {
  it('can convert an array of strings', () => {
    const node = createNode({
      plugins: [
        createLibraryPlugin({
          foo: {
            type: 'input',
            features: [formatsOptions],
            props: ['options'],
          },
        }),
      ],
      props: {
        type: 'foo',
        attrs: {
          options: ['foo', 'bar'],
        },
      },
    })
    expect(node.props.options).toEqual([
      {
        label: 'foo',
        value: 'foo',
      },
      {
        label: 'bar',
        value: 'bar',
      },
    ])
  })
})
