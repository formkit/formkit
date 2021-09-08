import { createApp, defineComponent, h, ref } from 'vue'

const ops = {
  '<=': (left, right) => left.value <= right,
}

function createElements(schema, data) {
  const element = schema.$el
  const children = schema.children.startsWith('$')
    ? data[schema.children.substr(1)]
    : { value: `invalid identifier: ${schema.children}` }
  let condition = () => true
  if (schema.condition) {
    let [left, operator, right] = schema.condition.split(' ')
    if (left.startsWith('$')) {
      left = data[left[1]]
    }
    if (right.startsWith('$')) {
      right = data[right[1]]
    }
    condition = ops[operator].bind(null, left, right)
  }
  return () => {
    const shouldShow = condition()
    return shouldShow ? h(element, children.value) : null
  }
}

const SchemaComponent = defineComponent({
  props: ['schema'],
  setup(props, context) {
    const renderFn = createElements(props.schema, context.attrs.data)
    return renderFn
  },
})

const root = defineComponent({
  setup(props, context) {
    const x = ref(5)
    const schema = {
      $el: 'em',
      children: '$x',
      condition: '$x <= 10',
    }

    return () => {
      console.log('render fn')
      return [
        h(
          'button',
          {
            onClick: () => (x.value += 1),
          },
          ['Hello ', h(SchemaComponent, { schema, data: { x } })]
        ),
      ]
    }
  },
})

createApp(root).mount('#app')
