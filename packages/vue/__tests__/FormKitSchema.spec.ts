import { reactive, nextTick, defineComponent, markRaw } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { FormKitSchemaNode } from '@formkit/core'
import { FormKitSchema } from '../src/FormKitSchema'
import { createNode, resetRegistry } from '@formkit/core'
import vuePlugin from '../src/corePlugin'

describe('parsing dom elements', () => {
  it.only('can render a single simple dom element', () => {
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

  it('can shadow scoped variables', () => {
    const wrapper = mount(FormKitSchema, {
      props: {
        data: {
          quantity: 2,
        },
        schema: [
          {
            $el: 'span',
            let: {
              total: 3,
            },
            children: [
              '$total',
              {
                $el: 'span',
                let: {
                  total: 5,
                },
                children: '$total',
              },
            ],
          },
        ],
      },
    })
    expect(wrapper.html()).toBe('<span>3<span>5</span></span>')
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

  it('can shadow nested loop scoped variables', async () => {
    const data = reactive({
      users: ['fred', 'ted'],
      foods: ['ice cream', 'pizza'],
    })
    const wrapper = mount(FormKitSchema, {
      props: {
        data,
        schema: [
          {
            $el: 'div',
            for: ['foobar', '$users'],
            children: [
              {
                $el: 'h2',
                children: '$foobar',
              },
              {
                $el: 'ul',
                children: [
                  {
                    $el: 'li',
                    for: ['foobar', '$foods'],
                    children: '$foobar',
                  },
                ],
              },
            ],
          },
        ],
      },
    })
    expect(wrapper.html()).toBe(
      `<div>
  <h2>fred</h2>
  <ul>
    <li>ice cream</li>
    <li>pizza</li>
  </ul>
</div>
<div>
  <h2>ted</h2>
  <ul>
    <li>ice cream</li>
    <li>pizza</li>
  </ul>
</div>`
    )
  })

  it('can render slots as the only child', () => {
    const wrapper = mount(FormKitSchema, {
      slots: {
        default: 'click me',
      },
      props: {
        schema: [
          {
            $el: 'button',
            children: '$slots.default',
          },
        ],
      },
    })
    expect(wrapper.html()).toBe('<button>click me</button>')
  })

  it('can render slots as one of many children', () => {
    const wrapper = mount(FormKitSchema, {
      slots: {
        default: 'click me',
      },
      props: {
        schema: [
          {
            $el: 'button',
            children: ['$slots.default', ' to buy'],
          },
        ],
      },
    })
    expect(wrapper.html()).toBe('<button>click me to buy</button>')
  })

  it('can render functional data reactively', async () => {
    const data = reactive({
      price: 10,
      quantity: 2,
      cost: (p: number, q: number) => p * q,
    })
    const wrapper = mount(FormKitSchema, {
      props: {
        data,
        schema: [
          {
            $el: 'button',
            children: ['Total $', '$cost($price, $quantity + 2) + 1'],
          },
        ],
      },
    })
    expect(wrapper.html()).toBe('<button>Total $41</button>')
    data.price = 11
    await nextTick()
    expect(wrapper.html()).toBe('<button>Total $45</button>')
  })

  it('can bind arbitrary objects as attrs', async () => {
    const data = reactive({
      details: {
        type: 'number',
        name: 'foobar',
        min: '20',
        step: '1',
      },
    })
    const wrapper = mount(FormKitSchema, {
      props: {
        data,
        schema: [
          {
            $el: 'input',
            bind: '$details',
          },
        ],
      },
    })
    expect(wrapper.html()).toBe(
      '<input type="number" name="foobar" min="20" step="1">'
    )
    data.details.name = 'barfoo'
    await nextTick()
    expect(wrapper.html()).toBe(
      '<input type="number" name="barfoo" min="20" step="1">'
    )
  })

  it('can bind arbitrary objects as attrs but attrs override them', async () => {
    const data = reactive({
      details: {
        type: 'number',
        name: 'foobar',
        min: '20',
        step: '1',
      },
    })
    const wrapper = mount(FormKitSchema, {
      props: {
        data,
        schema: [
          {
            $el: 'input',
            bind: '$details',
            attrs: {
              type: 'text',
            },
          },
        ],
      },
    })
    expect(wrapper.html()).toBe(
      '<input type="text" name="foobar" min="20" step="1">'
    )
    data.details.type = 'jimbo'
    await nextTick()
    expect(wrapper.html()).toBe(
      '<input type="text" name="foobar" min="20" step="1">'
    )
  })

  it('can "unwrap" a schema node by having a null value.', () => {
    const wrapper = mount(FormKitSchema, {
      props: {
        schema: [
          {
            $el: null,
            children: [
              {
                $el: 'label',
                children: [
                  {
                    $el: 'input',
                    attrs: {
                      type: 'checkbox',
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    })
    expect(wrapper.html()).toBe('<label><input type="checkbox"></label>')
  })
})

describe('rendering components', () => {
  it('can render component with props', () => {
    const cmp = defineComponent({
      props: {
        foobar: String,
      },
      template: `<span>{{ foobar }}</span>`,
    })
    const wrapper = mount(FormKitSchema, {
      props: {
        schema: [
          {
            $cmp: 'MyCmp',
            props: {
              foobar: 'world',
            },
          },
        ],
        library: markRaw({
          MyCmp: cmp,
        }),
      },
    })
    expect(wrapper.html()).toBe('<span>world</span>')
  })

  it('can render children in the default slot with scoped data', async () => {
    const MyComponent = defineComponent({
      name: 'MyComponent',
      props: {
        action: {
          type: String,
        },
      },
      data() {
        return {
          content: {
            price: 13.99,
            quantity: 1,
          },
        }
      },
      template:
        '<button @click="() => content.quantity++">{{ action }}{{ content.quantity }} for <slot v-bind="content"></slot></button>',
    })

    const library = markRaw({
      MyComponent,
    })

    const schema: FormKitSchemaNode[] = [
      {
        $cmp: 'MyComponent',
        props: {
          action: 'Purchase ',
        },
        children: '$price * $quantity',
      },
    ]

    const wrapper = mount(FormKitSchema, {
      props: {
        schema,
        library,
      },
    })

    expect(wrapper.html()).toBe('<button>Purchase 1 for 13.99</button>')
    wrapper.find('button').trigger('click')
    await nextTick()
    expect(wrapper.html()).toBe('<button>Purchase 2 for 27.98</button>')
  })

  it('can react when a schema’s function tail changes', async () => {
    const ctx = reactive<Record<string, number | undefined>>({
      price: 100,
    })
    const data = reactive({
      grab: () => ctx,
    })
    const wrapper = mount(FormKitSchema, {
      props: {
        data,
        schema: ['$: 13 + $grab().price'],
      },
    })
    expect(wrapper.html()).toBe('113')
    ctx.price = 200
    await nextTick()
    expect(wrapper.html()).toBe('213')
  })
})

describe('schema $get function', () => {
  beforeEach(() => resetRegistry())

  it('can fetch a global formkit node', async () => {
    const node = createNode({
      type: 'input',
      plugins: [vuePlugin],
      props: { id: 'boo' },
      value: 'you found me!',
    })
    const wrapper = mount(FormKitSchema, {
      props: {
        schema: ['$get(boo).value'],
      },
    })
    expect(wrapper.html()).toBe('you found me!')
    node.input('yes i did!', false)
    await new Promise((r) => setTimeout(r, 5))
    expect(wrapper.html()).toBe('yes i did!')
  })

  it('can fetch a global formkit node after it is registered', async () => {
    const wrapper = mount(FormKitSchema, {
      props: {
        schema: ['$get(bar).value'],
      },
    })
    expect(wrapper.html()).toBe('null')
    createNode({
      type: 'input',
      plugins: [vuePlugin],
      props: { id: 'bar' },
      value: 'you found me!',
    })
    await new Promise((r) => setTimeout(r, 5))
    expect(wrapper.html()).toBe('you found me!')
  })
})
