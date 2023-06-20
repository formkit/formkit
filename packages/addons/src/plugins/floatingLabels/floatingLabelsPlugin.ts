import {
  FormKitNode,
  FormKitPlugin,
  FormKitSchemaNode,
  FormKitSchemaCondition,
} from '@formkit/core'
import { clone } from '@formkit/utils'
import { findSection } from '@formkit/inputs'

/**
 * The options to be passed to {@link createFloatingLabelsPlugin | createFloatingLabelsPlugin}
 *
 * @public
 */
export interface FloatingLabelsOptions {
  useAsDefault?: boolean
}

/**
 * Creates a new floating label plugin.
 *
 * @param FloatingLabelsOptions - The options of {@link FloatingLabelsOptions | FloatingLabelsOptions} to pass to the plugin
 *
 * @returns A {@link @formkit/core#FormKitPlugin | FormKitPlugin}
 *
 * @public
 */
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
      node.on('created', () => {
        if (!node.props || !node.props.definition) return
        const inputDefinition = clone(node.props.definition)
        if (
          ['text', 'dropdown'].includes(node.props.family) ||
          ['datepicker', 'textarea'].includes(node.props.type)
        ) {
          const originalSchema = inputDefinition.schema
          if (typeof originalSchema !== 'function') return
          const higherOrderSchema = (
            extensions: Record<
              string,
              Partial<FormKitSchemaNode> | FormKitSchemaCondition
            >
          ) => {
            extensions.outer = {
              attrs: {
                'data-floating-label': 'true',
              },
            }
            extensions.label = {
              attrs: {
                'data-has-value': '$_value !== "" && $_value !== undefined',
              },
            }
            extensions.input = {
              attrs: {
                "data-has-value": '$_value !== "" && $_value !== undefined',
              },
            };

            const inputSchema = originalSchema(extensions)
            const finalSchema = Array.isArray(inputSchema)
              ? inputSchema[0]
              : inputSchema
            const [labelParentChildren, labelSection] = findSection(
              finalSchema,
              'label'
            )
            const [inputParentChildren] = findSection(finalSchema, 'input')

            if (labelParentChildren && labelSection && inputParentChildren) {
              labelParentChildren.splice(
                labelParentChildren.indexOf(labelSection),
                1
              )
              inputParentChildren.push(labelSection)
            }

            return inputSchema
          }

          inputDefinition.schema = higherOrderSchema
          if (inputDefinition.schemaMemoKey) {
            inputDefinition.schemaMemoKey += '-floating-label'
          }
          node.props.definition = inputDefinition
        }
      })
    }
  }
  return floatingLabelsPlugin
}
