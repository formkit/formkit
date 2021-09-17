import { reactive, nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { FormKitSchema } from '../FormKitSchema'

describe('parsing dom elements', () => {
  it('can render a single simple dom element', () => {
    const wrapper = mount(FormKitSchema, {
      props: {
        schema: [
          {
            $el: 'h1',
            children: 'Hello world',
            attrs: {
              'data-foo': 'bar',
            },
          },
        ],
      },
    })
    expect(wrapper.html()).toBe('<h1 data-foo="bar">Hello world</h1>')
  })

  it('can render a multiple children', () => {
    const wrapper = mount(FormKitSchema, {
      props: {
        schema: [
          {
            $el: 'h1',
            children: [
              {
                $el: 'em',
                children: 'Hello',
              },
              ' world',
            ],
            attrs: {
              'data-foo': 'bar',
            },
          },
        ],
      },
    })
    expect(wrapper.html()).toBe('<h1 data-foo="bar"><em>Hello</em> world</h1>')
  })

  it('can update data by replacing prop', async () => {
    const wrapper = mount(FormKitSchema, {
      props: {
        data: { a: { b: 'c' } },
        schema: [{ $el: 'h1', children: '$a.b' }, { $el: 'input' }],
      },
    })
    expect(wrapper.html()).toContain('c')
    wrapper.find('input').setValue('hello world')
    wrapper.setProps({ data: { a: { b: 'f' } } })
    await nextTick()
    expect(wrapper.html()).toContain('f')
    expect(wrapper.find('input').element.value).toBe('hello world')
  })

  it('can update new data by changing reactive prop', async () => {
    const data = reactive({ a: { b: 'c' } })
    const wrapper = mount(FormKitSchema, {
      props: {
        data,
        schema: [{ $el: 'h1', children: '$a.b' }],
      },
    })
    expect(wrapper.html()).toContain('c')
    data.a.b = 'f'
    await nextTick()
    expect(wrapper.html()).toContain('f')
  })

  it('can update new data by changing sub-object prop', async () => {
    const data = reactive({ a: { b: 'c' } })
    const wrapper = mount(FormKitSchema, {
      props: {
        data,
        schema: [{ $el: 'h1', children: '$a.b' }],
      },
    })
    data.a = { b: 'g' }
    await nextTick()
    expect(wrapper.html()).toContain('g')
  })

  it('can remove a node with the $if property', async () => {
    const data = reactive({ a: { b: 'c' } })
    const wrapper = mount(FormKitSchema, {
      props: {
        data,
        schema: [{ $el: 'h1', children: '$a.b', $if: "$a.b === 'c'" }],
      },
    })
    expect(wrapper.html()).toBe('<h1>c</h1>')
    data.a = { b: 'g' }
    await nextTick()
    expect(wrapper.html()).toBe('<!---->')
    data.a.b = 'c'
    await nextTick()
    expect(wrapper.html()).toBe('<h1>c</h1>')
  })

  it('can render different children with $if/$then/$else at root', async () => {
    const data = reactive({ value: 100 })
    const wrapper = mount(FormKitSchema, {
      props: {
        data,
        schema: {
          $if: '$value >= 100',
          $then: [{ $el: 'h1', children: ['$', '$value'] }],
          $else: {
            $if: '$value > 50',
            $then: [{ $el: 'h2', children: ['$', '$value'] }],
            $else: [{ $el: 'h3', children: 'You need a job!' }],
          },
        },
      },
    })
    expect(wrapper.html()).toBe('<h1>$100</h1>')
    data.value = 75
    await nextTick()
    expect(wrapper.html()).toBe('<h2>$75</h2>')
    data.value = 50
    await nextTick()
    expect(wrapper.html()).toBe('<h3>You need a job!</h3>')
  })

  it('can render different sibling children with $if/$then/$else at root', async () => {
    const data = reactive({ value: 100 })
    const wrapper = mount(FormKitSchema, {
      props: {
        data,
        schema: [
          {
            $el: 'label',
            children: 'What is your salary?',
          },
          {
            $if: '$value >= 100',
            $then: [{ $el: 'h1', children: ['$', '$value'] }],
            $else: {
              $if: '$value > 20',
              $then: [{ $el: 'h2', children: ['$', '$value'] }],
              $else: [{ $el: 'h3', children: 'You need a new job!' }],
            },
          },
          {
            $el: 'footer',
            children: '© All rights reserved.',
          },
        ],
      },
    })
    expect(wrapper.html()).toBe(
      `<label>What is your salary?</label>
<h1>$100</h1>
<footer>© All rights reserved.</footer>`
    )
    data.value = 75
    await nextTick()
    expect(wrapper.html()).toContain('<h2>$75</h2>')
    data.value = 20
    await nextTick()
    expect(wrapper.html()).toContain('<h3>You need a new job!</h3>')
  })

  it('can render attributes', () => {
    const wrapper = mount(FormKitSchema, {
      props: {
        schema: [
          {
            $el: 'button',
            attrs: {
              type: 'submit',
            },
          },
        ],
      },
    })
    expect(wrapper.html()).toBe('<button type="submit"></button>')
  })

  it('can render dynamic attribute values', async () => {
    const data = reactive({ type: 'foo' })
    const wrapper = mount(FormKitSchema, {
      props: {
        data,
        schema: [
          {
            $el: 'button',
            attrs: {
              'data-type': '$type',
            },
          },
        ],
      },
    })
    expect(wrapper.html()).toBe('<button data-type="foo"></button>')
    data.type = 'bar'
    await flushPromises()
    expect(wrapper.html()).toBe('<button data-type="bar"></button>')
  })

  it('can render dynamic attribute values at depth', async () => {
    const data = reactive({ color: 'red' })
    const wrapper = mount(FormKitSchema, {
      props: {
        data,
        schema: [
          {
            $el: 'button',
            attrs: {
              style: {
                color: '$color',
              },
            },
          },
        ],
      },
    })
    expect(wrapper.html()).toBe('<button style="color: red;"></button>')
    data.color = 'green'
    await flushPromises()
    expect(wrapper.html()).toBe('<button style="color: green;"></button>')
  })
})
