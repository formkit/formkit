import { defineFormKitConfig } from '@formkit/vue'

export default defineFormKitConfig({
  inputs: {
    checkbox: {
      type: 'input',
      schema: [{ $el: 'h1', children: 'Here i am!' }],
    },
  },
})
