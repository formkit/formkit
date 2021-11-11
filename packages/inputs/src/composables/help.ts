import { FormKitSchemaNode, FormKitSchemaComposable } from '@formkit/core'
import { extend } from '@formkit/utils'

const help: FormKitSchemaComposable = (
  schema = {},
  children = [],
  target = 'help',
  cond = '$help'
) => ({
  if: `$slots.${target}`,
  then: `$slots.${target}`,
  else: extend(
    {
      $el: 'div',
      attrs: {
        id: `$: "help-" + ${
          target == 'optionHelp' ? '$option.attrs.id' : '$id'
        }`,
        class: `$classes.${target}`,
      },
      if: cond,
      children,
    },
    schema
  ) as FormKitSchemaNode,
})

export default help
