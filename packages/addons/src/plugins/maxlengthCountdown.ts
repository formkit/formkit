import {
  FormKitNode,
  FormKitPlugin,
  FormKitSchemaNode,
  FormKitSchemaCondition,
} from '@formkit/core'
import { clone, undefine } from '@formkit/utils'

/**
 * The options to be passed to {@link createMaxLengthCountdownPlugin | createMaxLengthCountdownPlugin}
 *
 * useAsDefault: boolean - If true, the plugin will be used as default for all designated fields with a maxlength attribute,
 *                       unless the field has the maxlengthCountdown prop set to false
 * remainingText: string - The text to be displayed after the remaining characters count in the tooltip.
 *                       Can be overriden by setting the maxlengthRemainingText prop on the field
 * fieldTypes: string[] - The field types to apply the plugin to, default is only textarea
 * 
 * @public
 */
export interface MaxlengthCountdownOptions {
  useAsDefault?: boolean,
  remainingText?: string,
  fieldTypes?: string[]
}

/**
 * Creates a textarea max length countdown in the suffix container
 *
 * @param MaxlengthCountdownOptions - The options of {@link MaxlengthCountdownOptions | MaxlengthCountdownOptions} to pass to the plugin
 *
 * @returns A {@link @formkit/core#FormKitPlugin | FormKitPlugin}
 *
 * @public
 */
export function createMaxLengthCountdownPlugin(
  MaxlengthCountdownOptions?: MaxlengthCountdownOptions
): FormKitPlugin {

  const maxlengthCountdownPlugin = (node: FormKitNode) => {
    node.addProps(['maxlengthCountdown'])
    node.addProps(['maxlengthRemainingText'])
    node.addProps(['maxlengthStringCount'])

    let usePlugin = MaxlengthCountdownOptions?.useAsDefault === true

    let allowedTypes = MaxlengthCountdownOptions?.fieldTypes || ['textarea']
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
              MaxlengthCountdownOptions?.remainingText ||
              'remaining characters'
          }
        }
      })
    }
  }

  return maxlengthCountdownPlugin
}