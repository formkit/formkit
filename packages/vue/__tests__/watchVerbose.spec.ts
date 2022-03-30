import { ref, nextTick } from 'vue'
import watchVerbose from '../src/composables/watchVerbose'
import { jest } from '@jest/globals'

describe('watchVerbose', () => {
  it('can detect single level depth mutations', async () => {
    const values = ref({ a: 'a', b: 'b' })
    const callback = jest.fn()
    watchVerbose(values, callback)
    values.value.b = 'c'
    await nextTick()
    expect(callback).toHaveBeenCalledWith(['b'], 'c', values)
    values.value.b = 'd'
    await nextTick()
    expect(callback).toHaveBeenCalledWith(['b'], 'd', values)
  })

  it('can detect double level depth mutations', async () => {
    const values = ref({
      a: {
        b: 'c',
      },
      z: 'e',
    })
    const callback = jest.fn()
    watchVerbose(values, callback)
    values.value.a.b = 'foobar'
    await nextTick()
    expect(callback).toHaveBeenCalledWith(['a', 'b'], 'foobar', values)
  })
})
