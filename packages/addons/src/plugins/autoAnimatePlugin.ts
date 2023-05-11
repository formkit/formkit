import {
  FormKitNode,
  FormKitSchemaComponent,
  FormKitPlugin,
  isDOM,
} from '@formkit/core'
import autoAnimate, { AutoAnimateOptions } from '@formkit/auto-animate'
import { eachSection } from '@formkit/inputs'
import { FormKitSchemaDOMNode } from 'packages/core/src'

const pendingIds: Map<string, AutoAnimateOptions | undefined> = new Map()

let observer: MutationObserver | null = null
let observerTimeout: ReturnType<typeof setTimeout> | number = 0

const animationTargets: Record<string, string[]> = {
  global: ['outer', 'inner'],
  form: ['form'],
  repeater: ['items'],
  taglist: ['tags'],
  transferlist: ['sourceListItems', 'targetListItems'],
}

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
      clearTimeout(observerTimeout)
      pendingIds.delete(id)
      observerTimeout = setTimeout(() => {
        const targets = document.querySelectorAll('[data-auto-animate="true"]')
        targets.forEach((target) => {
          autoAnimate(target as HTMLElement, options || {})
        })
      }, 250)
    }
  })
}

/**
 * Adds auto-animate to each input automatically:
 *
 * @example
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

        // make a copy of the original schema
        const originalSchema = node.props.definition.schema

        // add an outer wrapper id or get the current one
        node.props.definition.schema = (extensions) => {
          const schema = originalSchema(extensions)
          const finalSchema = Array.isArray(schema) ? schema[0] : schema

          eachSection(
            finalSchema,
            (section: FormKitSchemaComponent | FormKitSchemaDOMNode) => {
              if (isDOM(section)) {
                let isAnimationTarget = false
                const sectionName = section?.meta?.section
                // if we have a section name, check if it's a known animation target
                if (sectionName && typeof sectionName === 'string') {
                  if (
                    animationTargets.global.includes(sectionName) ||
                    (animationTargets[node.props.type] &&
                      animationTargets[node.props.type].includes(sectionName))
                  ) {
                    isAnimationTarget = true
                  }
                }
                // if we're not a known target, check if we have autoAnimate meta set
                if (!isAnimationTarget && section?.meta?.autoAnimate === true) {
                  isAnimationTarget = true
                }
                // bail if we were not a match
                if (!isAnimationTarget) return

                // add the auto-animate attribute which our observer will pick up
                if (!section?.attrs) {
                  section.attrs = { 'data-auto-animate': true }
                } else {
                  Object.assign(section.attrs, { 'data-auto-animate': true })
                }

                // add the node id to the pending list
                if (node.props.id) {
                  pendingIds.set(node.props.id, options)
                }
              }
            }
          )
          return finalSchema
        }
      }
      if (!observer && typeof window !== 'undefined') createObserver()
    })
  }
}
