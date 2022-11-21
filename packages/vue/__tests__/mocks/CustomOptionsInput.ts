import type { FormKitFrameworkContext } from '@formkit/core'
import type { PropType} from 'vue';
import { defineComponent, h } from 'vue'

export default defineComponent({
  props: {
    context: {
      type: Object as PropType<FormKitFrameworkContext>,
      required: true,
    },
  },
  methods: {
    handle(e: Event) {
      this.context.node.input((e.target as HTMLInputElement).checked)
    },
  },
  render() {
    return h('input', {
      type: 'checkbox',
      onInput: this.handle,
      checked: this.context._value,
    })
  },
})
