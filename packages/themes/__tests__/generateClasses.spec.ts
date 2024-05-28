import { createNode } from '@formkit/core'
import { generateClasses } from '../src'
import { describe, expect, it } from 'vitest'

describe('generateClasses', () => {
  it('generates classes from an object', () => {
    const classes = generateClasses({
      global: {
        outer: 'outerGlobal',
        wrapper: 'wrapperGlobal'
      },
      text: {
        outer: 'outerText',
        wrapper: [
          'wrapperTextA wrapperTextB',
          'wrapperTextC wrapperTextD'
        ]
      },
      email: {
        outer: 'not_used'
      }
    })

    const node = createNode({
      props: { type: 'text' }
    })

    expect(classes).toEqual({
      outer: expect.any(Function),
      wrapper: expect.any(Function)
    })

    expect(classes.outer(node, 'outer')).toBe('outerGlobal outerText')
    expect(classes.wrapper(node, 'wrapper')).toBe('wrapperGlobal wrapperTextA wrapperTextB wrapperTextC wrapperTextD')
  })
})
