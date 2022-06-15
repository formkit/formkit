import { FormKitTypeDefinition } from '@formkit/core'
import {
  outer,
  inner,
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
  boxWrapper,
  boxLabel,
} from '../sections'
import { options, radios } from '../features'
import { $if, $extend } from '../compose'

/**
 * Input definition for a radio.
 * @public
 */
export const radio: FormKitTypeDefinition = {
  /**
   * The actual schema of the input, or a function that returns the schema.
   */
  // prettier-ignore
  schema: outer(
    $if(
      '$options == undefined',
      /**
       * Single radio structure.
       */
      boxWrapper(
        inner(
          prefix(),
          box(),
          decorator(),
          suffix(),
        ),
        $if('$label', boxLabel('$label'))
      ),
      /**
       * Multi radio structure.
       */
      fieldset(
        legend('$label'),
        help('$help'),
        boxOptions(
          boxOption(
            boxWrapper(
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
              $if('$option.label', boxLabel('$option.label')),
            ),
            boxHelp('$option.help')
          )
        )
      )
    ),
    // Help text only goes under the input when it is a single.
    $if('$options.length === 0 && $help', help()),
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
  features: [options, radios],
}
