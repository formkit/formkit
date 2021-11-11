import { FormKitExtendableSchemaRoot, FormKitSchemaNode } from '@formkit/core'
import { extend } from '@formkit/utils'
import label from '../composables/boxLabel'
import outer from '../composables/outer'
import wrapper from '../composables/boxWrapper'
import inner from '../composables/inner'
import box from '../composables/box'
import help from '../composables/help'
import messages from '../composables/messages'
import message from '../composables/message'
import fieldset from '../composables/fieldset'
import legend from '../composables/legend'
import boxes from '../composables/boxes'
import options from '../composables/boxOptions'
import decorator from '../composables/decorator'

/**
 * The schema for text classifications.
 * @public
 */
const boxSchema: FormKitExtendableSchemaRoot = (extensions = {}) => {
  const singleCheckbox = [
    wrapper(extensions.wrapper, [
      inner(extensions.inner, [
        box(extensions.input),
        decorator(extensions.decorator),
      ]),
      label(extensions.label, '$label'),
    ]),
    help(extensions.help, '$help'),
  ]

  const multiCheckbox = fieldset(extensions.wrapper, [
    legend(extensions.legend, '$label'),
    help(extensions.help, '$help'),
    options(extensions.options, [
      boxes(extensions.option, [
        wrapper(extensions.wrapper, [
          inner(extensions.inner, [
            box(
              extend(
                {
                  bind: '$option.attrs',
                  attrs: {
                    id: '$option.attrs.id',
                    value: '$option.value',
                    checked: '$fns.isChecked($option.value)',
                  },
                },
                extensions.input || {}
              ) as FormKitSchemaNode
            ),
            decorator(extensions.decorator),
          ]),
          label(extensions.label, '$option.label'),
        ]),
        help(
          extensions.optionHelp,
          '$option.help',
          'optionHelp',
          '$option.help'
        ),
      ]),
    ]),
  ])

  return [
    outer(extensions.outer, [
      {
        if: '$options.length',
        then: multiCheckbox,
        else: singleCheckbox,
      },
      messages(extensions.messages, [
        message(extensions.message, '$message.value'),
      ]),
    ]),
  ]
}

export default boxSchema
