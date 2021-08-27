import { createElements } from '../../../packages/vue/src/render'
import { defineComponent } from 'vue'
import schema from '../schema'

export default defineComponent({
  setup() {
    const tree = createElements(schema, { nodes: {}, library: {} })
    return () => tree
  },
})
