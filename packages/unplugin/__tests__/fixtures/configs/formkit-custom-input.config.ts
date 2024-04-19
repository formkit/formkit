import { defineFormKitConfig, createInput } from '@formkit/vue'
import CustomComponent from '../CustomComponent.vue'

const headingStyle: string = 'h1'

export default defineFormKitConfig({
  inputs: {
    text: {
      type: 'input',
      schema: [{ $el: headingStyle, text: 'Hello World' }],
    },
    custom: createInput(CustomComponent),
  },
})
