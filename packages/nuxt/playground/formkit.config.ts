import { createInput, defineFormKitConfig } from '@formkit/vue'

export default defineFormKitConfig(() => {
  return {
    inputs: {
      foo: createInput({ $el: 'h1', children: 'FOOBAR!' }),
    },
    theme: 'genesis',
    // theme: config.theme,
  }
})
