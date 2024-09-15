
import { createNode } from '@formkit/core'
import after_node from '../src/date_after_node'
import { describe, expect, it } from 'vitest'

describe('date_after_node rule', () => {
  it('passes when comparing to a field with a non valid date', () => {
    const form = createNode({ type: 'group' })
    const node = createNode({ name: 'final_date', parent: form, value: 'January 15, 2999' })
    createNode({ name: 'start_date', parent: form, value: '' })
    expect(after_node(node, 'start_date')).toBe(true)
  })

  it('passes when compare to a field with previous date', () => {
    const form = createNode({ type: 'group' })
    const node = createNode({ name: 'final_date', parent: form, value: 'January 15, 2999' })
    createNode({ name: 'start_date', parent: form, value: 'January 14, 2999' })
    expect(after_node(node, 'start_date')).toBe(true)
  })

  it('fails when comparing field is not provided', () => {
    const node = createNode({ name: 'final_date', value: 'January 15, 2999' })
    expect(after_node(node)).toBe(false)
  })

  it('fails when comparing to a field with equals date', () => {
    const form = createNode({ type: 'group' })
    const node = createNode({ name: 'final_date', parent: form, value: 'January 15, 2999' })
    createNode({ name: 'start_date', parent: form, value: 'January 15, 2999' })
    expect(after_node(node, 'start_date')).toBe(false)
  })

  it('fails when comparing to a field with future date', () => {
    const form = createNode({ type: 'group' })
    const node = createNode({ name: 'final_date', parent: form, value: 'January 13, 2999' })
    createNode({ name: 'start_date', parent: form, value: 'January 15, 2999' })
    expect(after_node(node, 'start_date')).toBe(false)
  })
})
