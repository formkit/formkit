import { FormKitNode, FormKitPlugin } from '@formkit/core'
import { floatingLabelTextInput, floatingLabelTextAreaInput } from './schema'

export interface FloatingLabelsOptions {
  useAsDefault?: boolean
}

export function createFloatingLabelsPlugin(
  FloatingLabelsOptions?: FloatingLabelsOptions
): FormKitPlugin {
  const floatingLabelsPlugin = (node: FormKitNode) => {
    node.addProps(['floatingLabel'])
    const useFloatingLabels =
      typeof node.props.floatingLabel === 'boolean'
        ? node.props.floatingLabel
        : typeof FloatingLabelsOptions?.useAsDefault === 'boolean'
        ? FloatingLabelsOptions?.useAsDefault
        : false

    if (useFloatingLabels) {
      if (
        [
          'text',
          'color',
          'date',
          'datetimeLocal',
          'email',
          'month',
          'number',
          'password',
          'search',
          'tel',
          'time',
          'url',
          'week',
        ].includes(node.props.type)
      ) {
        node.define(floatingLabelTextInput)
      }
      if (node.props.type === 'textarea') {
        node.define(floatingLabelTextAreaInput)
      }
    }
  }
  return floatingLabelsPlugin
}
