import { defineFormKitConfig, createInput } from '@formkit/vue'
import CustomComponent from '../CustomComponent.vue'
const headingStyle: string | number = 'h1'

export default defineFormKitConfig({
  optimize: {
    inputs: {
      builtins: false,
      optimize: true,
    },
  },
  inputs: {
    text: {
      type: 'input',
      schema: [{ $el: headingStyle, text: 'Hello World' }],
    },
    custom: createInput(CustomComponent),
  },
})
