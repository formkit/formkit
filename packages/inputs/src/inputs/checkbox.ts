import { FormKitTypeDefinition } from '@formkit/core'
import {
  outer,
  inner,
  wrapper,
  label,
  help,
  boxHelp,
  messages,
  message,
  prefix,
  suffix,
  fieldset,
  decorator,
  box,
  legend,
  boxOption,
  boxOptions,
} from '../sections'
import formatsOptions from '../features/options'
import checkboxes from '../features/checkboxes'

import { $if, $attrs, $extend } from '../compose'

const definition: FormKitTypeDefinition = {
  /**
   * The actual schema of the input, or a function that returns the schema.
   */
  // prettier-ignore
  schema: outer(
    $if(
      '$options == undefined',
      /**
       * Single checkbox structure.
       */
      wrapper(
        inner(
          prefix(),
          box(),
          decorator(),
          suffix(),
        ),
        label('$label')
      ),
      /**
       * Multi checkbox structure.
       */
      fieldset(
        legend('$label'),
        help('$help'),
        boxOptions(
          boxOption(
            wrapper(
              inner(
                prefix(),
                $extend(box(), {
                  bind: '$option.attrs',
                  attrs: {
                    id: '$option.attrs.id',
                    value: '$option.value',
                    checked: '$fns.isChecked($option.value)',
                  },
                }),
                decorator(),
                suffix()
              ),
              $attrs({ for: '$option.id' }, label('$option.label'))
            ),
            boxHelp('$option.attrs.help')
          )
        )
      )
    ),
    // Help text only goes under the input when it is a single.
    $if('$options == undefined', help()),
    messages(
      message('$message.value')
    )
  ),
  /**
   * The type of node, can be a list, group, or input.
   */
  type: 'input',
  /**
   * An array of extra props to accept for this input.
   */
  props: ['options', 'onValue', 'offValue'],
  /**
   * Additional features that should be added to your input
   */
  features: [formatsOptions, checkboxes],
}

export default definition

/**
 * The schema for text classifications.
 * @public
 */
// const boxSchema: FormKitExtendableSchemaRoot = (extensions = {}) => {
//   const singleCheckbox = [
//     wrapper(extensions.wrapper, [
//       inner(extensions.inner, [
//         prefix(extensions.prefix),
//         box(extensions.input),
//         decorator(extensions.decorator),
//         suffix(extensions.suffix),
//       ]),
//       label(extensions.label, '$label'),
//     ]),
//     help(extensions.help, '$help'),
//   ]

//   const multiCheckbox = fieldset(extensions.fieldset, [
//     legend(extensions.legend, '$label'),
//     help(extensions.help, '$help'),
//     options(extensions.options, [
//       boxes(extensions.option, [
//         wrapper(extensions.wrapper, [
//           inner(extensions.inner, [
//             prefix(extensions.prefix),
//             box(
//               extend(
//                 {
//                   bind: '$option.attrs',
//                   attrs: {
//                     id: '$option.attrs.id',
//                     value: '$option.value',
//                     checked: '$fns.isChecked($option.value)',
//                   },
//                 },
//                 extensions.input || {}
//               ) as FormKitSchemaNode
//             ),
//             decorator(extensions.decorator),
//             suffix(extensions.suffix),
//           ]),
//           label(extensions.label, '$option.label'),
//         ]),
//         help(
//           extensions.optionHelp,
//           '$option.help',
//           'optionHelp',
//           '$option.help'
//         ),
//       ]),
//     ]),
//   ])

//   return [
//     outer(extensions.outer, [
//       {
//         if: '$options.length',
//         then: multiCheckbox,
//         else: singleCheckbox,
//       },
//       messages(extensions.messages, [
//         message(extensions.message, '$message.value'),
//       ]),
//     ]),
//   ]
// }

// export default boxSchema
