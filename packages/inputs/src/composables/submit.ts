import { FormKitSchemaNode, FormKitSchemaComposable } from '@formkit/core'
import { extend } from '@formkit/utils'

const submit: FormKitSchemaComposable = (schema = {}) => ({
  if: '$slots.submit',
  then: '$slots.submit',
  else: [
    extend(
      {
        $cmp: 'FormKit',
        bind: '$submitAttrs',
        props: {
          ignore: true,
          type: 'submit',
          'data-loading': '$state.loading',
          disabled: '$disabled',
          label: '$submitLabel',
        },
      },
      schema
    ) as FormKitSchemaNode,
  ],
})
export default submit
