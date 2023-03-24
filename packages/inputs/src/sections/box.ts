import { createSection } from '../createSection'

/**
 * Box section used for grouping options
 *
 * @public
 */
export const box = createSection('input', () => ({
  $el: 'input',
  bind: '$attrs',
  attrs: {
    type: '$type',
    name: '$node.props.altName || $node.name',
    disabled: '$option.attrs.disabled || $disabled',
    onInput: '$handlers.toggleChecked',
    checked: '$fns.eq($_value, $onValue)',
    onBlur: '$handlers.blur',
    value: '$: true',
    id: '$id',
    'aria-describedby': {
      if: '$options.length',
      then: {
        if: '$option.help',
        then: '$: "help-" + $option.attrs.id',
        else: undefined,
      },
      else: {
        if: '$help',
        then: '$: "help-" + $id',
        else: undefined,
      },
    },
  },
}))
