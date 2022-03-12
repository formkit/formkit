import { reactive, nextTick, defineComponent, markRaw, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { FormKitSchemaNode } from '@formkit/core'
import { FormKitSchema } from '../src/FormKitSchema'
import { createNode, resetRegistry } from '@formkit/core'
import corePlugin from '../src/bindings'
import { plugin } from '../src/plugin'
import defaultConfig from '../src/defaultConfig'

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
    expect(wrapper.html()).toBe('')
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

  it('can render an conditional attribute with compiled values', async () => {
    const data = reactive({ status: 'warning' })
    const wrapper = mount(FormKitSchema, {
      props: {
        data,
        schema: [
          {
            $el: 'div',
            attrs: {
              id: {
                if: '$status === warning',
                then: '$status',
                else: 'no-warning',
              },
            },
          },
        ],
      },
    })
    expect(wrapper.html()).toBe('<div id="warning"></div>')
    data.status = 'ok'
    await nextTick()
    expect(wrapper.html()).toBe('<div id="no-warning"></div>')
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
    expect(wrapper.html()).toBe(`<span>a</span>
<span>b</span>
<span>c</span>`)
    data.alphabet[1] = 'd'
    await nextTick()
    expect(wrapper.html()).toBe(`<span>a</span>
<span>d</span>
<span>c</span>`)
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
    expect(wrapper.html()).toBe(`<span>bob</span>
<span>ted</span>`)
    data.accounts.unshift({ user: { name: 'fred' } })
    await nextTick()
    expect(wrapper.html()).toBe(`<span>fred</span>
<span>bob</span>
<span>ted</span>`)
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

  it('can render the loop data inside the default slot', () => {
    const wrapper = mount(FormKitSchema, {
      props: {
        data: {
          items: ['a', 'b', 'c'],
        },
        schema: [
          {
            $cmp: 'FormKit',
            for: ['item', 'index', '$items'],
            props: {
              type: 'group',
            },
            children: '$index + ": " + $item',
          },
        ],
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.text()).toBe('0: a1: b2: c')
  })

  it('can render the loop data inside the default slot when nested in an $el', async () => {
    const colors = ref(['red', 'green', 'blue'])
    const items = ref(['a', 'b', 'c'])
    const wrapper = mount(FormKitSchema, {
      props: {
        data: {
          colors,
          items,
        },
        schema: [
          {
            $el: 'div',
            for: ['color', '$colors'],
            children: [
              {
                $el: 'span',
                for: ['item', 'index', '$items'],
                children: [
                  {
                    $cmp: 'FormKit',
                    props: {
                      type: 'group',
                    },
                    children: '$color + ": " + $index + " : " + $item + "|"',
                  },
                ],
              },
            ],
          },
        ],
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.text()).toBe(
      'red: 0 : a|red: 1 : b|red: 2 : c|green: 0 : a|green: 1 : b|green: 2 : c|blue: 0 : a|blue: 1 : b|blue: 2 : c|'
    )
    colors.value.shift()
    await nextTick()
    expect(wrapper.text()).toBe(
      'green: 0 : a|green: 1 : b|green: 2 : c|blue: 0 : a|blue: 1 : b|blue: 2 : c|'
    )
    items.value.push('d')
    await nextTick()
    expect(wrapper.text()).toBe(
      'green: 0 : a|green: 1 : b|green: 2 : c|green: 3 : d|blue: 0 : a|blue: 1 : b|blue: 2 : c|blue: 3 : d|'
    )
  })

  it('can render iteration data inside the slot of a conditional component', async () => {
    const colors = ref(['red', 'green', 'blue'])
    const wrapper = mount(FormKitSchema, {
      props: {
        data: {
          colors,
        },
        schema: [
          {
            $el: 'div',
            for: ['color', '$colors'],
            children: {
              if: '$color === "red"',
              then: 'RED!',
              else: {
                $cmp: 'FormKit',
                props: {
                  type: 'group',
                },
                children: '$color + "|"',
              },
            },
          },
        ],
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.text()).toBe('RED!green|blue|')
  })

  it('can render iteration data in an element that is in the slot of a conditional component', async () => {
    const letters = ref(['a', 'b', 'c'])
    const wrapper = mount(FormKitSchema, {
      props: {
        data: {
          letters,
        },
        schema: [
          {
            $el: 'div',
            for: ['letter', 'index', '$letters'],
            attrs: {
              class: 'repeated',
            },
            children: [
              {
                if: '$letter !== "b"',
                then: {
                  $el: 'h2',
                  children: 'Not B',
                },
                else: {
                  $cmp: 'FormKit',
                  props: {
                    type: 'group',
                  },
                  children: [
                    {
                      $el: 'h1',
                      children: '$letter',
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.text()).toBe('Not BbNot B')
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
      '<input name="foobar" min="20" step="1" type="text">'
    )
    data.details.type = 'jimbo'
    await nextTick()
    expect(wrapper.html()).toBe(
      '<input name="foobar" min="20" step="1" type="text">'
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

  it('can re-parse a schema with components when new object', async () => {
    const schema: FormKitSchemaNode[] = reactive([
      {
        $cmp: 'FormKit',
        props: {
          type: 'text',
          label: 'Text input',
        },
      },
    ])

    const wrapper = mount(FormKitSchema, {
      props: {
        schema: schema,
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.findAll('.formkit-outer').length).toBe(1)
    wrapper.setProps({
      schema: [
        ...schema,
        {
          $cmp: 'FormKit',
          props: {
            type: 'checkbox',
            label: 'Checkbox input',
          },
        },
      ],
    })
    await nextTick()
    expect(wrapper.findAll('.formkit-outer').length).toBe(2)
  })

  it('can re-parse a schema with components when deep update', async () => {
    const schema: FormKitSchemaNode[] = reactive([
      {
        $cmp: 'FormKit',
        props: {
          type: 'text',
          label: 'Text input',
        },
      },
    ])

    const wrapper = mount(FormKitSchema, {
      props: {
        schema: schema,
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.findAll('.formkit-outer').length).toBe(1)
    schema.push({
      $cmp: 'FormKit',
      props: {
        type: 'checkbox',
        label: 'Checkbox input',
      },
    })
    await nextTick()
    expect(wrapper.findAll('.formkit-outer').length).toBe(2)
  })

  it('can use shorthand for $formkit', () => {
    const data = reactive({ value: 11 })
    const wrapper = mount(FormKitSchema, {
      props: {
        data,
        schema: [
          {
            $formkit: 'select',
            id: 'where_waldo',
            if: '$value > 10',
            name: 'foobar',
            options: {
              hello: 'Hello',
              world: 'World',
            },
          },
        ],
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.html())
      .toContain(`<select id="where_waldo" class=\"formkit-input\" name=\"foobar\">
        <option class=\"formkit-option\" value=\"hello\">Hello</option>
        <option class=\"formkit-option\" value=\"world\">World</option>
      </select>`)
  })

  it('does not let $get to bogard a select list placeholder', async () => {
    const wrapper = mount(FormKitSchema, {
      props: {
        schema: [
          {
            $cmp: 'FormKit',
            props: {
              type: 'select',
              id: 'drink',
              label: 'Drink',
              placeholder: 'Pick your drink',
              options: { coffee: 'Coffee', espresso: 'Espresso', tea: 'Tea' },
              validation: 'required',
            },
          },
          '$get(drink).value',
        ],
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    await nextTick()
    expect(wrapper.html()).toContain(
      '<option hidden="" disabled="" data-is-placeholder="true" class="formkit-option" value="">Pick your drink</option>'
    )
  })

  it('can access content from original data inside default slot', () => {
    const wrapper = mount(FormKitSchema, {
      props: {
        data: {
          doodle: 'Poodle',
        },
        schema: [
          {
            $formkit: 'group',
            children: ['$doodle'],
          },
        ],
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.html()).toBe('Poodle')
  })

  it('can access content from original data inside deeply nested slot', () => {
    const wrapper = mount(FormKitSchema, {
      props: {
        data: {
          doodle: 'Poodle',
        },
        schema: [
          {
            $formkit: 'group',
            children: [
              {
                $formkit: 'list',
                children: [
                  {
                    $formkit: 'button',
                    children: '$doodle',
                  },
                ],
              },
            ],
          },
        ],
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.find('button').text()).toBe('Poodle')
  })

  it('parses props containing schema by default', () => {
    const wrapper = mount(FormKitSchema, {
      props: {
        schema: [
          {
            $formkit: 'text',
            label: 'foobar',
            help: 'text',
            id: 'foobar',
            sectionsSchema: {
              help: {
                $el: 'h1',
                children: '$label',
              },
            },
          },
        ],
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    // We expect the h1 to be empty here because '$label' does not exist in the
    // parent scope — but it does exist in the child scope. This indicates the
    // value $label was pared by the parent instead of the child.
    expect(wrapper.html()).toContain(
      '<h1 id="help-foobar" class="formkit-help"></h1>'
    )
  })

  it('does not parses props containing __raw__ prefix', () => {
    const wrapper = mount(FormKitSchema, {
      props: {
        schema: [
          {
            $formkit: 'text',
            label: 'foobar',
            help: 'text',
            id: 'foobar',
            __raw__sectionsSchema: {
              help: {
                $el: 'h1',
                children: '$label',
              },
            },
          },
        ],
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    // We expect the h1 to contain the value of the label defined in the child,
    // this would indicate that sectionsSchema was parsed by the child.
    expect(wrapper.html()).toContain(
      '<h1 id="help-foobar" class="formkit-help">foobar</h1>'
    )
  })
})

describe('schema $get function', () => {
  beforeEach(() => resetRegistry())

  it('can fetch a global formkit node', async () => {
    const node = createNode({
      type: 'input',
      plugins: [corePlugin],
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
      plugins: [corePlugin],
      props: { id: 'bar' },
      value: 'you found me!',
    })
    await new Promise((r) => setTimeout(r, 5))
    expect(wrapper.html()).toBe('you found me!')
  })
})

describe('$reset', () => {
  it('compiles $reset when used as a child', () => {
    const wrapper = mount(FormKitSchema, {
      props: {
        data: {
          reset: 'foobar',
        },
        schema: ['$reset'],
      },
    })
    expect(wrapper.html()).toBe('foobar')
  })

  it('compiles $reset when used as a prop', () => {
    const wrapper = mount(FormKitSchema, {
      props: {
        data: {
          reset: 'foobar',
        },
        schema: [
          {
            $formkit: 'text',
            help: 'bam',
            sectionsSchema: {
              help: { children: '$reset' },
            },
          },
        ],
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.find('.formkit-help').text()).toBe('foobar')
  })

  it('ignores $reset when used in a FormKit class prop', () => {
    const wrapper = mount(FormKitSchema, {
      props: {
        data: {
          reset: 'foobar',
        },
        schema: [
          {
            $formkit: 'text',
            inputClass: '$reset my-class',
          },
        ],
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.find('input').attributes('class')).toBe('my-class')
  })
})
