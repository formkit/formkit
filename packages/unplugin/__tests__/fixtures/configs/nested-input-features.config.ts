import { defineFormKitConfig } from '@formkit/vue'
import type { FormKitTypeDefinition } from '@formkit/core'

const login: FormKitTypeDefinition = {
  type: 'group',
  schema: [
    {
      $formkit: 'text',
      prefixIcon: 'person',
      label: 'username',
    },
    {
      $formkit: 'password',
      prefixIcon: 'lock',
      label: 'password',
    },
    {
      $formkit: 'file',
    },
    {
      $formkit: 'submit',
      label: 'login',
    },
  ],
}

export default defineFormKitConfig({
  optimize: true,
  inputs: {
    login,
    submit: {
      type: 'input',
      schema: () => ({
        $cmp: 'FormKit',
        props: {
          type: 'button',
          value: 100,
          suffixIcon: 'left',
          validation: 'required|min:3',
        },
      }),
      icons: {
        prefix: 'right',
      },
    },
  },
})
