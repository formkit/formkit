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
  it('can take a function and sets the optionsLoader prop and assigns an empty array', () => {
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
          options: () => new Promise(() => {}),
        },
      },
    })
    expect(node.props.options).toEqual([])
    expect(node.props.optionsLoader).toBeDefined()
  })
})
