import { defineFormKitConfig, createInput } from '@formkit/vue'
import CustomComponent from '../CustomComponent.vue'

const x = 123

export default defineFormKitConfig({
  inputs: {
    custom: createInput(CustomComponent),
  },
})
