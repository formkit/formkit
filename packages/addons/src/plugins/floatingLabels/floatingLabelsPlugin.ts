import {
  FormKitNode,
  FormKitPlugin,
  FormKitSchemaNode,
  FormKitSchemaCondition,
} from '@formkit/core'
import { clone, whenAvailable } from '@formkit/utils'
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
 * Traverses through parent elements to find the next closest non-transparent assigned background color
 * @param element - The element to start the search from
 */
function findParentWithBackgroundColor(element: HTMLElement): string {
  let backgroundColor = 'white'
  while (backgroundColor === 'white' && element.parentElement) {
    element = element.parentElement
    const style = window.getComputedStyle(element)
    const bgColor = style.backgroundColor

    if (
      bgColor &&
      bgColor !== 'rgba(0, 0, 0, 0)' &&
      bgColor !== 'transparent'
    ) {
      backgroundColor = bgColor
    }
    // Check if the color uses CSS variable for opacity
    const opacityMatch = backgroundColor.match(/var\(([^)]+)\)/)
    if (opacityMatch) {
      const opacityVar = opacityMatch[1]
      const opacity =
        getComputedStyle(document.documentElement)
          .getPropertyValue(opacityVar)
          .trim() || '1'
      backgroundColor = `rgba(${bgColor}, ${opacity})`
    }
    console.log(backgroundColor)
  }
  return backgroundColor
}

/**
 * Sets the background color of the label to the background color of the parent element
 * @param node - The node to set the background color for
 * @param nodeRoot - The root node to start the search from
 * @param timeout - The timeout to wait for the background color to be set
 */
function setBackgroundColor(
  node: FormKitNode,
  nodeRoot: HTMLElement,
  timeout: number
) {
  setTimeout(() => {
    node.props._labelBackgroundColor = findParentWithBackgroundColor(nodeRoot)
  }, timeout)
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
    node.addProps(['floatingLabel', '_labelBackgroundColor'])

    const useFloatingLabels =
      typeof node.props.floatingLabel === 'boolean'
        ? node.props.floatingLabel
        : typeof FloatingLabelsOptions?.useAsDefault === 'boolean'
        ? FloatingLabelsOptions?.useAsDefault
        : false

    if (useFloatingLabels && node.context) {
      // use a mouseEnter event to trigger a calculation of the background color
      whenAvailable(node.context.id, () => {
        if (!node.context) return
        const nodeEl = document.getElementById(node.context?.id)
        if (!nodeEl) return
        setBackgroundColor(node, nodeEl, 100)
      })

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
                style: '$: "background-color: " + $_labelBackgroundColor',
                'data-style':
                  '$: "background-color: " + $_labelBackgroundColor',
              },
            }

            const inputSchema = originalSchema(extensions)
            const finalSchema = Array.isArray(inputSchema)
              ? inputSchema[0]
              : inputSchema
            const [labelParentChildren, labelSection] = findSection(
              finalSchema,
              'label'
            )
            const targetSection =
              node.props.type === 'dropdown' ? 'selector' : 'input'
            const [inputParentChildren] = findSection(
              finalSchema,
              targetSection
            )

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
