import type { SetupContext } from 'vue'
import { defineComponent, h } from 'vue'

function createChild(context: SetupContext) {
  if (context.slots.default) {
    return context.slots.default
  }
  return () => 'Default slot content'
}

export default defineComponent({
  name: 'TestGroup',
  setup(_, context) {
    const child = createChild(context)
    return () => h('fieldset', child())
  },
})
