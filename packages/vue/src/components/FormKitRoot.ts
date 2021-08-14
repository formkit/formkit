import { defineComponent, h } from 'vue'
import FormKitGenerator from './FormKitGenerator'

export default defineComponent({
  setup(_props, options) {
    return () => h(FormKitGenerator, options.attrs)
  },
})
