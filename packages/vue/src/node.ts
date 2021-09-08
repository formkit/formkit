import { createNode, FormKitNodeType, FormKitProps } from '@formkit/core'
import { extend } from '@formkit/utils'
import { FormKitSchemaNode, FormKitSchemaContext } from '@formkit/schema'
import { defineComponent, PropType, Component, reactive, ref } from 'vue'
import { createRenderFunction } from './render'

const RenderValue = defineComponent(function (props: { value?: any }) {
  return () => (props.value ? [props.value] : null)
})

export default defineComponent({
  inheritAttrs: false,
  components: {
    RenderValue: RenderValue,
  },
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
    const value =
      props.value || (type === 'group' ? {} : type === 'list' ? [] : '')
    const node = createNode({
      type: type as FormKitNodeType,
      name: props.name,
      value: value as any,
      props: props.props,
    })
    let inputNode: HTMLInputElement

    const nodeValue = ref(node.value)
    const schemaNodeData = {
      __POJO__: false,
      value: nodeValue,
      _value: node.value,
      props: props.props,
      name: node.name,
      input: (event: InputEvent) => {
        inputNode = event.target as HTMLInputElement
        node.input((event.target as HTMLInputElement).value)
      },
      node,
    }

    const context = reactive(
      extend(props.schemaContext, {
        nodes: {
          [props.id]: schemaNodeData,
        },
      }) as FormKitSchemaContext<Component>
    )

    // Listen to the commit
    node.on('commit', ({ payload }) => {
      schemaNodeData.value = payload
    })
    // Listen to the input
    node.on('input', ({ payload }) => {
      if (inputNode) {
        nodeValue.value = payload
        console.log(payload)
      }
      schemaNodeData._value = payload
    })
    const render = createRenderFunction(props.children, context)
    return render
  },
})
