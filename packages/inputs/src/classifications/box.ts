import { FormKitExtendableSchemaRoot, FormKitSchemaNode } from '@formkit/core'
import { extend } from '@formkit/utils'
import label from '../composables/label'
import outer from '../composables/outer'
import wrapper from '../composables/wrapper'
import inner from '../composables/inner'
import box from '../composables/box'
import help from '../composables/help'
import messages from '../composables/messages'
import message from '../composables/message'
import fieldset from '../composables/fieldset'
import legend from '../composables/legend'
import boxes from '../composables/boxes'
import decorator from '../composables/decorator'

/**
 * The schema for text classifications.
 * @public
 */
const boxSchema: FormKitExtendableSchemaRoot = (extensions = {}) => {
  const checkbox = label(extensions.label, [
    inner(extensions.inner, [
      box(extensions.input),
      decorator(extensions.decorator),
    ]),
    '$label',
  ])

  const checkboxOption = label(
    extend(
      { attrs: { for: '$option.attrs.id' } },
      extensions.label || {}
    ) as FormKitSchemaNode,
    [
      inner(extensions.inner, [
        box(
          extend(
            {
              bind: '$option.attrs',
              attrs: {
                id: '$option.attrs.id',
                onInput: '$handlers.toggleChecked',
                checked: '$fns.isChecked($option.value)',
                value: '$option.value',
              },
            },
            extensions.input || {}
          ) as FormKitSchemaNode
        ),
        decorator(extensions.decorator),
      ]),
      '$option.label',
    ]
  )

  return [
    outer(extensions.outer, [
      wrapper(extensions.wrapper, {
        if: '$options.length',
        then: fieldset(extensions.fieldset, [
          legend(extensions.legend, '$label'),
          boxes(extensions.boxes, [checkboxOption]),
        ]),
        else: checkbox,
      }),
      help(extensions.help, '$help'),
      messages(extensions.messages, [
        message(extensions.message, '$message.value'),
      ]),
    ]),
  ]
}

export default boxSchema
