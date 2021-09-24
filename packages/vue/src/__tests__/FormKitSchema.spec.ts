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

  it('can remove a node with the "if" property', async () => {
    const data = reactive({ a: { b: 'c' } })
    const wrapper = mount(FormKitSchema, {
      props: {
        data,
        schema: [{ $el: 'h1', children: '$a.b', if: "$a.b === 'c'" }],
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

  it('can render different children with if/then/else at root', async () => {
    const data = reactive({ value: 100 })
    const wrapper = mount(FormKitSchema, {
      props: {
        data,
        schema: {
          if: '$value >= 100',
          then: [{ $el: 'h1', children: ['$', '$value'] }],
          else: {
            if: '$value > 50',
            then: [{ $el: 'h2', children: ['$', '$value'] }],
            else: [{ $el: 'h3', children: 'You need a job!' }],
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

  it('can render different sibling children with if/then/else at root', async () => {
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
            if: '$value >= 100',
            then: [{ $el: 'h1', children: ['$', '$value'] }],
            else: {
              if: '$value > 20',
              then: [{ $el: 'h2', children: ['$', '$value'] }],
              else: [{ $el: 'h3', children: 'You need a new job!' }],
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

  it('can perform string concatenation in dynamic attributes', async () => {
    const data = reactive({ size: 10 })
    const wrapper = mount(FormKitSchema, {
      props: {
        data,
        schema: [
          {
            $el: 'button',
            attrs: {
              style: {
                fontSize: '$size + 1 + em',
              },
            },
          },
        ],
      },
    })
    expect(wrapper.html()).toBe('<button style="font-size: 11em;"></button>')
    data.size = 5
    await nextTick()
    expect(wrapper.html()).toBe('<button style="font-size: 6em;"></button>')
  })

  it('can render conditional set of attributes', async () => {
    const data = reactive({ status: 'warning' })
    const wrapper = mount(FormKitSchema, {
      props: {
        data,
        schema: [
          {
            $el: 'div',
            attrs: {
              if: "$status === 'warning'",
              then: {
                'data-status': '$status',
                style: {
                  color: 'red',
                },
              },
              else: {
                if: '$status === information',
                then: {
                  'data-info': 'true',
                },
                else: {
                  'data-status': '$status',
                },
              },
            },
          },
        ],
      },
    })
    expect(wrapper.html()).toBe(
      '<div data-status="warning" style="color: red;"></div>'
    )
    data.status = 'information'
    await nextTick()
    expect(wrapper.html()).toBe('<div data-info="true"></div>')
    data.status = 'error'
    await nextTick()
    expect(wrapper.html()).toBe('<div data-status="error"></div>')
  })

  it('can render a single complex conditional attribute', async () => {
    const data = reactive({ size: 1 })
    const wrapper = mount(FormKitSchema, {
      props: {
        data,
        schema: [
          {
            $el: 'button',
            attrs: {
              'data-size': {
                if: '$size < 5',
                then: 'extra-small',
                else: {
                  if: '$size >= 5 && $size < 10',
                  then: 'medium',
                  else: {
                    if: '$size >= 10 && $size < 20',
                    then: 'large',
                    else: 'extra-large',
                  },
                },
              },
            },
          },
        ],
      },
    })
    expect(wrapper.html()).toBe('<button data-size="extra-small"></button>')
    data.size = 5
    await nextTick()
    expect(wrapper.html()).toBe('<button data-size="medium"></button>')
    data.size = 10
    await nextTick()
    expect(wrapper.html()).toBe('<button data-size="large"></button>')
    data.size = 50
    await nextTick()
    expect(wrapper.html()).toBe('<button data-size="extra-large"></button>')
  })

  it('can access scoped variables', () => {
    const wrapper = mount(FormKitSchema, {
      props: {
        schema: [
          {
            $el: 'div',
            let: { foo: 'bar' },
            children: '$foo',
          },
        ],
      },
    })
    expect(wrapper.html()).toBe('<div>bar</div>')
  })

  it('shadows pre-existing variables within scope', () => {
    const wrapper = mount(FormKitSchema, {
      props: {
        data: {
          foo: 'car',
        },
        schema: [
          {
            $el: 'div',
            let: { foo: 'bar' },
            children: '$foo',
          },
        ],
      },
    })
    expect(wrapper.html()).toBe('<div>bar</div>')
  })

  it('can use variables directly in compiled operations', () => {
    const wrapper = mount(FormKitSchema, {
      props: {
        data: {
          quantity: 2,
        },
        schema: [
          {
            $el: 'div',
            let: {
              quantity: 3,
              price: 5,
              taxes: 0.1,
              fee: 2,
            },
            children: ['$', '$price * $quantity * (1 + $taxes) + $fee'],
          },
        ],
      },
    })
    expect(wrapper.html()).toBe('<div>$18.5</div>')
  })

  it('can render a list of items', () => {
    const wrapper = mount(FormKitSchema, {
      props: {
        schema: [
          {
            $el: 'ul',
            children: [
              {
                $el: 'li',
                for: ['value', 'key', ['a', 'b', 'c']],
                children: [
                  {
                    $el: 'span',
                    for: ['price', 2],
                    children: ['$key', ':', '$value', ', ', '$price'],
                  },
                ],
              },
            ],
          },
        ],
      },
    })
    expect(wrapper.html()).toBe(
      `<ul>
  <li><span>0:a, 0</span><span>0:a, 1</span></li>
  <li><span>1:b, 0</span><span>1:b, 1</span></li>
  <li><span>2:c, 0</span><span>2:c, 1</span></li>
</ul>`
    )
  })

  it('reacts to iteration data changes', async () => {
    const data = reactive({
      alphabet: ['a', 'b', 'c'],
    })
    const wrapper = mount(FormKitSchema, {
      props: {
        data,
        schema: [
          {
            $el: 'span',
            for: ['value', '$alphabet'],
            children: '$value',
          },
        ],
      },
    })
    expect(wrapper.html()).toBe('<span>a</span><span>b</span><span>c</span>')
    data.alphabet[1] = 'd'
    await nextTick()
    expect(wrapper.html()).toBe('<span>a</span><span>d</span><span>c</span>')
  })

  it('can access nested iteration data', async () => {
    const data = reactive({
      accounts: [{ user: { name: 'bob' } }, { user: { name: 'ted' } }],
    })
    const wrapper = mount(FormKitSchema, {
      props: {
        data,
        schema: [
          {
            $el: 'span',
            for: ['account', '$accounts'],
            children: '$account.user.name',
          },
        ],
      },
    })
    expect(wrapper.html()).toBe('<span>bob</span><span>ted</span>')
    data.accounts.unshift({ user: { name: 'fred' } })
    await nextTick()
    expect(wrapper.html()).toBe(
      '<span>fred</span><span>bob</span><span>ted</span>'
    )
  })
})
