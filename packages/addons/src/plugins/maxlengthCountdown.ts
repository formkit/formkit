import {
  FormKitNode,
  FormKitPlugin,
  FormKitSchemaNode,
  FormKitSchemaCondition,
} from '@formkit/core'
import { clone, undefine, whenAvailable } from '@formkit/utils'

/**
 * The options to be passed to {@link createTextareaMaxLengthCountdownPlugin | createTextareaMaxLengthCountdownPlugin}
 *
 * useAsDefault: boolean - If true, the plugin will be used as default for all designated fields with a maxlength attribute,
 *                       unless the field has the maxlengthCountdown prop set to false
 * remainingText: string - The text to be displayed after the remaining characters count in the tooltip.
 *                       Can be overriden by setting the maxlengthRemainingText prop on the field
 * fieldTypes: string[] - The field types to apply the plugin to, default is only textarea
 * 
 * @public
 */
export interface TextareaMaxLengthCountdownOptions {
  useAsDefault?: boolean,
  remainingText?: string,
  fieldTypes?: string[]
}

/**
 * Creates a textarea max length countdown in the suffix container
 *
 * @param TextareaMaxLengthCountdownOptions - The options of {@link TextareaMaxLengthCountdownOptions | TextareaMaxLengthCountdownOptions} to pass to the plugin
 *
 * @returns A {@link @formkit/core#FormKitPlugin | FormKitPlugin}
 *
 * @public
 */
export function createTextareaMaxLengthCountdownPlugin(
  TextareaMaxLengthCountdownOptions?: TextareaMaxLengthCountdownOptions
): FormKitPlugin {

  const textareaMaxLengthCountdownPlugin = (node: FormKitNode) => {
    node.addProps(['maxlengthCountdown'])
    node.addProps(['maxlengthRemainingText'])
    node.addProps(['maxlengthStringCount'])

    let usePlugin = TextareaMaxLengthCountdownOptions?.useAsDefault === true

    let allowedTypes = TextareaMaxLengthCountdownOptions?.fieldTypes || ['textarea']
    if (typeof allowedTypes === 'string') allowedTypes = [allowedTypes]
    if (!allowedTypes.includes(node.props.type)) {
      usePlugin = false
    }

    // ALLOW OVERRIDES FOR NON-DEFAULT FIELDS IF EXPLICITLY SET
    if (undefine(node.props.maxlengthCountdown) ||
      node.props.maxlengthCountdown === 'true' ||
      node.props.maxlengthCountdown === true) {
      usePlugin = true
    }
    
    if (usePlugin) {
      node.on('created', () => {
        if (!node.props || !node.props.definition) return
        if (node.props.attrs.maxlength === undefined) return

        if (node.props.attrs.maxlength && parseInt(node.props.attrs.maxlength) > 0) {
          const inputDefinition = clone(node.props.definition)
          const originalSchema = inputDefinition.schema
          if (typeof originalSchema !== 'function') return

          const higherOrderSchema = (
            extensions: Record<
              string,
              Partial<FormKitSchemaNode> | FormKitSchemaCondition
            >
          ) => {
            extensions.suffix = {
              if: 'true',
              children: [
                {
                  $el: 'span',
                  attrs: {
                    class: '$classes.inputMaxlengthRemaining',
                  },
                  children: [
                    `$maxlengthStringCount`,
                    {
                      $el: 'span',
                      children: `$maxlengthStringCount + ' ' + $maxlengthRemainingText`,
                      class: '$classes.inputMaxlengthRemainingHover',
                    }
                  ]
                },
                "$suffix || ''"
              ]
            }

            return originalSchema(extensions)
          }

          inputDefinition.schema = higherOrderSchema
          if (inputDefinition.schemaMemoKey) {
            inputDefinition.schemaMemoKey += '-maxlength-remaining'
          }
          node.props.definition = inputDefinition

          updateCountValue({ payload: node._value as string })
          node.on('input', updateCountValue)

          function updateCountValue ({ payload }: { payload: string }) {
            let stringLength = parseInt(node.props.attrs.maxlength) - (payload ? payload.length : 0)
            node.props.maxlengthStringCount = Math.max(0, stringLength)
            node.props.maxlengthRemainingText = node.props.maxlengthRemainingText ||
              TextareaMaxLengthCountdownOptions?.remainingText ||
              'remaining characters'
          }
        }
      })
    }
  }

  return textareaMaxLengthCountdownPlugin
}