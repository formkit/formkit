import { defineFormKitConfig } from '@formkit/vue'

export default defineFormKitConfig({
  inputs: {
    custom: {
      type: 'input',
      schema: [{ $el: 'h1', children: 'Here i am!' }],
    },
  },
})
