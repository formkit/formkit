import { createNode } from '@formkit/core'
import { textarea } from '@formkit/inputs'
import { describe, expect, it } from 'vitest'
import { createMaxLengthCountdownPlugin } from '../src/plugins/maxlengthCountdown'

describe('maxlengthCountdown', () => {
  it.each([
    { useAsDefault: true, prop: false, count: undefined },
    { useAsDefault: true, prop: 'false', count: undefined },
    { useAsDefault: true, prop: undefined, count: 7 },
    { useAsDefault: false, prop: undefined, count: undefined },
    { useAsDefault: false, prop: true, count: 7 },
    { useAsDefault: false, prop: 'true', count: 7 },
    { useAsDefault: false, prop: '', count: 7 },
  ])(
    'sets the count to $count with useAsDefault=$useAsDefault and prop=$prop',
    ({ useAsDefault, prop, count }) => {
      const node = createNode({
        value: 'abc',
        props: {
          type: 'textarea',
          definition: textarea,
          attrs: { maxlength: 10 },
          ...(prop === undefined ? {} : { maxlengthCountdown: prop }),
        },
        plugins: [createMaxLengthCountdownPlugin({ useAsDefault })],
      })

      expect(node.props.maxlengthStringCount).toBe(count)
    }
  )
})
