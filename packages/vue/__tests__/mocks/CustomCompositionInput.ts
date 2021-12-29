import { FormKitFrameworkContext } from '@formkit/core'
import { defineComponent, PropType, h } from 'vue'

export default defineComponent({
  props: {
    context: {
      type: Object as PropType<FormKitFrameworkContext>,
      required: true,
    },
  },
  setup(props) {
    const handle = (e: Event) => {
      props.context.node.input((e.target as HTMLInputElement).checked)
    }
    return () =>
      h('input', {
        type: 'checkbox',
        onInput: handle,
        checked: props.context._value,
      })
  },
})
