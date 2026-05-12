import {
  FormKitNode,
  FormKitPlugin,
  FormKitSectionsSchema,
} from '@formkit/core'
import { clone, extend, isPojo, whenAvailable } from '@formkit/utils'
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
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return backgroundColor
  }
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
        window
          .getComputedStyle(document.documentElement)
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
  nodeRoot: HTMLElement
): void {
  if (typeof window === 'undefined' || !node.context || !nodeRoot.isConnected)
    return
  node.props._labelBackgroundColor = findParentWithBackgroundColor(nodeRoot)
}

function observeBackgroundAncestors(
  nodeRoot: HTMLElement,
  callback: () => void
): MutationObserver | undefined {
  if (typeof MutationObserver === 'undefined') return
  const observer = new MutationObserver(callback)
  let element: HTMLElement | null = nodeRoot
  while (element) {
    observer.observe(element, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    })
    element = element.parentElement
  }
  return observer
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
    let observer: MutationObserver | null = null
    let backgroundObserver: MutationObserver | undefined
    const timeouts = new Set<ReturnType<typeof setTimeout>>()

    const setManagedTimeout = (callback: () => void, delay: number) => {
      const timeout = setTimeout(() => {
        timeouts.delete(timeout)
        callback()
      }, delay)
      timeouts.add(timeout)
      return timeout
    }

    const clearTimeouts = () => {
      for (const timeout of timeouts) {
        clearTimeout(timeout)
      }
      timeouts.clear()
    }

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
          const nodeRoot = nodeEl
          setManagedTimeout(() => setBackgroundColor(node, nodeRoot), 0)
        }

        const inputDefinition = clone(node.props.definition)
        if (
          ['text', 'dropdown'].includes(node.props.family) ||
          ['datepicker', 'textarea'].includes(node.props.type)
        ) {
          const originalSchema = inputDefinition.schema
          if (typeof originalSchema !== 'function') return
          const higherOrderSchema = (extensions: FormKitSectionsSchema) => {
            const outerAttrs = {
              attrs: {
                'data-floating-label': 'true',
              },
            }
            extensions.outer = isPojo(extensions.outer)
              ? (extend(extensions.outer, outerAttrs, false, true) as (typeof extensions)['outer'])
              : outerAttrs

            const labelAttrs = {
              attrs: {
                style: {
                  if: '$_offsetCalculated',
                  then:
                    '$: ({ "background-color": $_labelBackgroundColor, left: $_labelOffset })',
                  else:
                    '$: ({ transition: "none", "background-color": $_labelBackgroundColor, left: $_labelOffset })',
                },
              },
            }
            extensions.label = isPojo(extensions.label)
              ? (extend(extensions.label, labelAttrs, false, true) as (typeof extensions)['label'])
              : labelAttrs

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
        observer = new MutationObserver(() => {
          if (!nodeEl) return
          calculateLabelOffset(node, nodeEl)

          // delay the enabling of animations until after
          // initial label positions are set
          setManagedTimeout(() => {
            if (!node.context) return
            node.props._offsetCalculated = true
          }, 100)
        })

        whenAvailable(node.context.id, () => {
          if (!node.context) return
          nodeEl = document.getElementById(node.context?.id)
          if (!nodeEl) return
          const nodeRoot = nodeEl
          setManagedTimeout(() => setBackgroundColor(node, nodeRoot), 100)
          backgroundObserver = observeBackgroundAncestors(nodeRoot, () => {
            if (!node.context || !nodeEl) return
            const currentNodeRoot = nodeEl
            setManagedTimeout(
              () => setBackgroundColor(node, currentNodeRoot),
              0
            )
          })
          observer?.observe(nodeEl.parentNode as Node, {
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

      node.on('destroyed', () => {
        clearTimeouts()
        observer?.disconnect()
        observer = null
        backgroundObserver?.disconnect()
        backgroundObserver = undefined
        nodeEl = null
      })
    }
  }
  return floatingLabelsPlugin
}
