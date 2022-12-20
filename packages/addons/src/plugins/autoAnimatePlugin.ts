import { FormKitNode, FormKitPlugin, isConditional, isDOM } from '@formkit/core'
import autoAnimate, { AutoAnimateOptions } from '@formkit/auto-animate'
import { extend } from '@formkit/utils'
import { FormKitSchemaDOMNode } from 'packages/core/src'

const pendingIds: Map<string, AutoAnimateOptions | undefined> = new Map()

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
  pendingIds.forEach((options, id) => {
    const outer = document.getElementById(id)
    if (outer) {
      pendingIds.delete(id)
      autoAnimate(outer, options || {})
    }
  })
}

/**
 * Adds auto-animate to each input automatically:
 *
 * @example Adding to FormKit
 *
 * ```javascript
 * import { createApp } from 'vue'
 * import App from 'App.vue'
 * import { createAutoAnimatePlugin } from '@formkit/addons'
 * import { plugin, defaultConfig } from '@formkit/vue'
 *
 * createApp(app).use(plugin, defaultPlugin({
 *   plugins: [
 *     createAutoAnimatePlugin({
 *       // optional config
 *     })
 *   ]
 * }))
 * ```
 *
 * @param options - {@link https://github.com/formkit/auto-animate/blob/master/src/index.ts#L596 | AutoAnimateOptions }
 *
 * @returns
 * {@link @formkit/core#FormKitPlugin | FormKitPlugin}
 *
 * @public
 */
export function createAutoAnimatePlugin(
  options?: AutoAnimateOptions
): FormKitPlugin {
  return (node: FormKitNode) => {
    node.on('created', () => {
      if (typeof node.props.definition?.schema === 'function') {
        if (typeof window === undefined) return
        // add an outer wrapper id or get the current one
        const original = node.props.definition.schema
        node.props.definition.schema = (extensions) => {
          extensions.outer = extend(
            { attrs: { id: `outer-${node.props.id}` } },
            extensions.outer || {}
          ) as Partial<FormKitSchemaDOMNode>
          const finalSchema = original(extensions)
          const outermostSchema = isConditional(finalSchema[0])
            ? Array.isArray(finalSchema[0].else)
              ? finalSchema[0].else[0]
              : finalSchema[0].else
            : finalSchema[0]
          if (
            outermostSchema &&
            isDOM(outermostSchema) &&
            outermostSchema.attrs &&
            'id' in outermostSchema.attrs
          ) {
            pendingIds.set(
              String(
                outermostSchema.attrs.id === '$id'
                  ? node.props.id
                  : outermostSchema.attrs.id
              ),
              options || undefined
            )
          }
          return finalSchema
        }
      }
      if (!observer && typeof window !== 'undefined') createObserver()
    })
  }
}
