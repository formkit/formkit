import { mount } from '@vue/test-utils'
import { plugin } from '../src/plugin'
import defaultConfig from '../src/defaultConfig'
// import { jest } from '@jest/globals'

describe('group', () => {
  it('can pass values down to children', () => {
    const wrapper = mount(
      {
        template: `
        <FormKit type="group" :value="{foo: 'abc', baz: 'hello'}">
          <FormKit name="foo" />
          <FormKit name="bar" />
          <FormKit name="baz" />
        </FormKit>`,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    const inputs = wrapper.findAll('input')
    expect(inputs[0].element.value).toBe('abc')
    expect(inputs[1].element.value).toBe('')
    expect(inputs[2].element.value).toBe('hello')
  })

  it('can use v-model to change input values', async () => {
    const wrapper = mount(
      {
        data() {
          return {
            formData: {
              name: 'bob',
              address: {
                street: 'jane rd.',
                city: 'crypto city',
              },
            },
            street: 'jane rd.',
          }
        },
        template: `
      <FormKit type="group" v-model="formData">
        <FormKit name="name" />
        <FormKit type="group" name="address">
          <FormKit name="street" v-model="street" />
          <FormKit name="city" />
        </FormKit>
      </FormKit>
      `,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    // const consoleMock = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const inputs = wrapper.findAll('input')
    expect(inputs[0].element.value).toBe('bob')
    expect(inputs[1].element.value).toBe('jane rd.')
    expect(inputs[2].element.value).toBe('crypto city')
    inputs[1].setValue('foo rd.')
    await new Promise((r) => setTimeout(r, 30))
    expect(wrapper.vm.$data.formData).toEqual({
      name: 'bob',
      address: {
        street: 'foo rd.',
        city: 'crypto city',
      },
    })
    expect(wrapper.vm.$data.street).toBe('foo rd.')
    // expect(consoleMock).toHaveBeenCalled()
    // consoleMock.mockRestore()
  })
})
