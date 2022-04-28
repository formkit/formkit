import { composable } from '../compose'

const box = composable('input', () => ({
  $el: 'input',
  bind: '$attrs',
  attrs: {
    type: '$type',
    class: '$classes.input',
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

export default box
