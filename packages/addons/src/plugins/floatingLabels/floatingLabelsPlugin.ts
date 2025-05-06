import {
  FormKitNode,
  FormKitPlugin,
  FormKitSectionsSchema,
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
    let nodeEl: HTMLElement | null = null
    node.addProps({
      floatingLabel: {
        boolean: true,
        default: !!FloatingLabelsOptions?.useAsDefault,
      },
      _labelBackgroundColor: {},
      _labelOffset: {},
      _offsetCalculated: {},
    })

    const useFloatingLabels = node.props.floatingLabel

    if (useFloatingLabels && node.context) {
      node.on('created', () => {
        if (!node.props || !node.props.definition || !node.context) return

        // available for users who want to update the background color manually
        node.context.handlers.updateLabelBackgroundColor = () => {
          if (!node.context || !nodeEl) return
          setBackgroundColor(node, nodeEl, 0)
        }

        const inputDefinition = clone(node.props.definition)
        if (
          ['text', 'dropdown'].includes(node.props.family) ||
          ['datepicker', 'textarea'].includes(node.props.type)
        ) {
          const originalSchema = inputDefinition.schema
          if (typeof originalSchema !== 'function') return
          const higherOrderSchema = (extensions: FormKitSectionsSchema) => {
            extensions.outer = {
              attrs: {
                'data-floating-label': 'true',
              },
            }
            extensions.label = {
              attrs: {
                style: {
                  if: '$_offsetCalculated',
                  then: '$: "background-color: " + $_labelBackgroundColor + "; left: " + $_labelOffset + ";"',
                  else: '$: "transition: none; background-color: " + $_labelBackgroundColor + "; left: " + $_labelOffset + ";"',
                },
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

            if (
              Array.isArray(labelParentChildren) &&
              labelSection &&
              Array.isArray(inputParentChildren)
            ) {
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

      node.on('mounted', () => {
        if (!node.context) return

        // set a mutation observer on the nodeEl parent to refire calculateLabelOffset
        // whenever the children are changed
        const observer = new MutationObserver(() => {
          if (!nodeEl) return
          calculateLabelOffset(node, nodeEl)

          // delay the enabling of animations until after
          // initial label positions are set
          setTimeout(() => {
            node.props._offsetCalculated = true
          }, 100)
        })

        whenAvailable(node.context.id, () => {
          if (!node.context) return
          nodeEl = document.getElementById(node.context?.id)
          if (!nodeEl) return
          setBackgroundColor(node, nodeEl, 100)
          observer.observe(nodeEl.parentNode as Node, {
            childList: true,
            subtree: true,
            attributes: true,
          })
        })
      })

      function calculateLabelOffset(node: FormKitNode, nodeEl: HTMLElement) {
        const labelEl = nodeEl.parentNode?.querySelector('.formkit-label')
        const left = nodeEl.offsetLeft
        const style = window.getComputedStyle(nodeEl)
        const paddingLeft = parseInt(style.paddingLeft, 10)
        const offset = left + paddingLeft

        if (labelEl && offset) {
          node.props._labelOffset = `calc(${offset}px - 0.25em)`
        }
      }
    }
  }
  return floatingLabelsPlugin
}
