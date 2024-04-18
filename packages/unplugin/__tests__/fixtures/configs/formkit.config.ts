import { defineFormKitConfig, createInput } from '@formkit/vue'
import CustomComponent from '../CustomComponent.vue'

export default defineFormKitConfig({
  inputs: {
    custom: createInput(CustomComponent),
  },
})
