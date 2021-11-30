import { createNode } from '../src/node'
import { generateClassList } from '../src/classes'

describe('class list generation', () => {
  it('returns null if generateClassList() is called without a user supplied class list', () => {
    const node = createNode()
    expect(
      generateClassList(node, 'outer', { 'formkit-outer': true, 'mb-5': true })
    ).toBe('formkit-outer mb-5')
    expect(generateClassList(node, 'label')).toBe(null)
  })
})
