import { createNode, FormKitNodeType, FormKitProps } from '@formkit/core'
import { extend } from '@formkit/utils'
import { FormKitSchemaNode, FormKitSchemaContext } from '@formkit/schema'
import { defineComponent, PropType, Component, reactive } from 'vue'
import { createElements } from './render'

export default defineComponent({
  inheritAttrs: false,
  props: {
    id: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      default: 'input',
    },
    value: {},
    name: {
      type: String,
      required: false,
    },
    children: {
      type: Array as PropType<FormKitSchemaNode[]>,
      default: () => [],
    },
    schemaContext: {
      type: Object as PropType<FormKitSchemaContext<Component>>,
      default: () => ({ library: {}, nodes: {} }),
    },
    props: {
      type: Object as PropType<Partial<FormKitProps>>,
      default: () => ({}),
    },
  },
  setup(props) {
    const type = ['input', 'group', 'list'].includes(props.type)
      ? props.type
      : 'input'
    const node = createNode({
      type: type as FormKitNodeType,
      name: props.name,
      value: props.value as any,
      props: props.props,
    })
    const reactiveNode = reactive({
      __POJO__: false,
      value: node.value,
      props: props.props,
      name: node.name,
      input: (event: InputEvent) =>
        node.input((event.target as HTMLInputElement).value),
      node,
    })
    // Listen to the commit
    node.on('commit', ({ payload }) => {
      reactiveNode.value = payload
    })
    if (props.children && props.children.length) {
      return () =>
        createElements(
          props.children,
          extend(props.schemaContext, {
            nodes: {
              [props.id]: reactiveNode,
            },
          }) as FormKitSchemaContext<Component>
        )
    }
    return () => null
  },
})
