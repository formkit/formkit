import { createNode, compile } from '@formkit/core'
import {
  FormKit,
  FormKitSchema,
  plugin,
  defaultConfig,
  setErrors,
} from '@formkit/vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import '../src/index'
import radios from '../../inputs/src/features/radios'

describe('core error interception', () => {
  it('decodes E100', () => {
    expect(() =>
      createNode({ type: 'input', name: 'flavor', children: [createNode()] })
    ).toThrowError('Only groups, lists, and forms can have children (flavor).')
  })

  it('decodes E101', () => {
    expect(() => {
      const node = createNode({ type: 'input', name: 'french' })
      ;(node.store as Record<string, any>).fooBar = '123'
    }).toThrowError(
      'You cannot directly modify the store (french). See: https://formkit.com/advanced/core#message-store'
    )
  })

  it('decodes E102', () => {
    expect(() => {
      const node = createNode({ type: 'input', name: 'assigned_node' })
      ;(node as Record<string, any>).address = 'foobar'
    }).toThrowError('You cannot directly assign node.address (assigned_node)')
  })

  it('decodes E103', () => {
    expect(() => compile('+ == 10')).toThrowError(
      'Schema expressions cannot start with an operator (+)'
    )
  })

  it('decodes E104', () => {
    expect(() => compile('1 == 10+')).toThrowError(
      'Schema expressions cannot end with an operator (+ in "10+")'
    )
  })

  it('decodes E105', () => {
    expect(() => compile('')).toThrowError('Invalid schema expression: ')
  })
})

describe('core warning interception', () => {
  it('decodes W150', () => {
    const warning = vi.fn(() => {})
    const mock = vi.spyOn(global.console, 'warn').mockImplementation(warning)
    compile('$fns(123, 50)').provide(() => {
      return {
        $fns: () => 'bar',
      }
    })()
    mock.mockRestore()
    expect(warning).toBeCalledWith(
      'Schema function "$fns()" is not a valid function.'
    )
  })
})

describe('vue error interception', () => {
  it('decodes E600', () => {
    const warning = vi.fn(() => {})
    const mock = vi.spyOn(global.console, 'warn').mockImplementation(warning)
    expect(() =>
      mount(FormKit, {
        props: {
          type: 'slick',
          name: 'foobar',
        },
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      })
    ).toThrowError('Unknown input type "slick" ("foobar")')
    mock.mockReset()
  })

  it('decodes E601', () => {
    expect(() =>
      mount(FormKit, {
        props: {
          type: 'barfoo',
          name: 'bizbaz',
        },
        global: {
          plugins: [
            [
              plugin,
              defaultConfig({
                inputs: {
                  barfoo: {
                    type: 'input',
                  },
                },
              }),
            ],
          ],
        },
      })
    ).toThrowError(
      'Input definition "barfoo" is missing a schema or component property (bizbaz).'
    )
  })
})

describe('vue warning interception', () => {
  it('decodes W650', () => {
    const warning = vi.fn(() => {})
    const mock = vi.spyOn(global.console, 'warn').mockImplementation(warning)
    mount(FormKitSchema, {
      props: {
        schema: ['$get(true).value'],
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    mock.mockRestore()
    expect(warning).toBeCalledWith(
      'Schema "$get()" must use the id of an input to access.'
    )
  })
  it('decodes W651', () => {
    const warning = vi.fn(() => {})
    const mock = vi.spyOn(global.console, 'warn').mockImplementation(warning)
    mount(
      {
        template: `<h1>hi</h1>`,
        setup() {
          setErrors('nothere', {})
        },
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    mock.mockRestore()
    expect(warning).toBeCalledWith(
      'Cannot setErrors() on "nothere" because no such id exists.'
    )
  })
})

describe('input warning interception', () => {
  it('decodes W350', () => {
    const warning = vi.fn(() => {})
    const mock = vi.spyOn(global.console, 'warn').mockImplementation(warning)
    mount(FormKit, {
      props: {
        name: 'radio',
        type: {
          type: 'input',
          schema: ['hello'],
          features: [radios],
        },
        options: /foobar/ as unknown as string[],
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    mock.mockRestore()
    expect(warning).toBeCalledWith(
      'Invalid options prop for radio input. See https://formkit.com/inputs/radio'
    )
  })
})
