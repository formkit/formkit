import { FormKitNode, isConditional, isDOM } from '@formkit/core'
import autoAnimate from '@formkit/auto-animate'
import { extend } from '@formkit/utils'
import { FormKitSchemaDOMNode } from 'packages/core/src'

const pendingIds: Set<string> = new Set()

let observer: MutationObserver | null = null

/**
 * Create a new mutation observer that checks for the document for ids. We do
 * this instead of iterating over the mutations because getElementById is by far
 * the fastest way check for an element in the DOM, much faster that iterating
 * over the mutations themselves.
 */
function createObserver() {
  observeIds()
  observer = new MutationObserver(() => {
    observeIds()
    if (!pendingIds.size && observer) {
      observer.disconnect()
      observer = null
    }
  })
  observer.observe(document, { childList: true, subtree: true })
}

function observeIds() {
  pendingIds.forEach((id) => {
    const outer = document.getElementById(id)
    if (outer) {
      pendingIds.delete(id)
      console.log('autoAnimate()', outer)
      autoAnimate(outer)
    }
  })
}

/**
 * Adds auto-animate to each input automatically.
 * @param node - A formkit node
 * @public
 */
export function autoAnimatePlugin(node: FormKitNode): void {
  node.on('created', () => {
    if (typeof node.props.definition?.schema === 'function') {
      // add an outer wrapper id or get the current one
      const original = node.props.definition.schema
      node.props.definition.schema = (extensions) => {
        extensions.outer = extend(
          { attrs: { id: `outer-${node.props.id}` } },
          extensions.outer || {}
        ) as Partial<FormKitSchemaDOMNode>
        const finalSchema = original(extensions)
        const outer = isConditional(finalSchema[0])
          ? Array.isArray(finalSchema[0].else)
            ? finalSchema[0].else[0]
            : finalSchema[0].else
          : finalSchema[0]
        if (outer && isDOM(outer) && outer.attrs && 'id' in outer.attrs) {
          pendingIds.add(String(outer.attrs.id))
        }
        return finalSchema
      }
    }
    if (!observer) createObserver()
  })
}
