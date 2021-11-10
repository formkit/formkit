import { FormKitNode } from '@formkit/core'

/**
 * Converts the options prop to usable values.
 * @param node - A formkit node.
 */
export default function (node: FormKitNode): void {
  node.hook.prop((prop, next) => {
    if (
      prop.prop === 'options' &&
      Array.isArray(prop.value) &&
      node.props.placeholder &&
      !('multiple' in node.props?.attrs)
    ) {
      prop.value.unshift({
        label: node.props.placeholder,
        value: '',
        attrs: {
          hidden: true,
          disabled: true,
        },
      })
    }
    return next(prop)
  })
  node.hook.input((value, next) => {
    if (
      !node.props.placeholder &&
      value === undefined &&
      node.props?.options &&
      !('multiple' in node.props?.attrs)
    ) {
      value = node.props.options[0].value
    }
    return next(value)
  })
}
