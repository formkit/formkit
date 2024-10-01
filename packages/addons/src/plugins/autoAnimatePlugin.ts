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
const optionOverrides = new Map<string, AutoAnimateOptions | undefined>()

let autoAnimateOptionsId = 0

let observer: MutationObserver | null = null
let observerTimeout: ReturnType<typeof setTimeout> | number = 0

function createObserverResource() {
  observer = new MutationObserver(() => {
    observeIds()
    if (!pendingIds.size && observer) {
      observer.disconnect()
      observer = null
    }
  })

  return {
    observer,
    [Symbol.dispose]() {
      observer?.disconnect(); // Ensure the observer is disconnected when disposed
    }
  };
}

/**
 * Create a new mutation observer that checks for the document for ids. We do
 * this instead of iterating over the mutations because getElementById is by far
 * the fastest way check for an element in the DOM, much faster that iterating
 * over the mutations themselves.
 */
function createObserver() {
  observeIds()
  using observerResource = createObserverResource()
  observerResource.observer.observe(document, { childList: true, subtree: true })
}

function observeIds() {
  pendingIds.forEach((options, id) => {
    const outer = document.getElementById(id)
    if (outer) {
      clearTimeout(observerTimeout)
      pendingIds.delete(id)
      observerTimeout = setTimeout(() => {
        const targets = document.querySelectorAll('[data-auto-animate]')
        targets.forEach((target) => {
          // get the value of data-auto-animate
          let overrideOptions: AutoAnimateOptions | undefined
          const optionsId = target.getAttribute('data-auto-animate')
          if (optionsId) {
            overrideOptions = optionOverrides.get(optionsId)
          }
          autoAnimate(target as HTMLElement, overrideOptions || options || {})
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
 *       duration: 250,
 *       easing: 'ease-in-out',
 *       delay: 0,
 *     },
 *     {
 *       // optional animation targets object
 *       global: ['outer', 'inner'],
 *       form: ['form'],
 *       repeater: ['items'],
 *     })
 *   ]
 * }))
 * ```
 *
 * @param options - {@link https://github.com/formkit/auto-animate/blob/master/src/index.ts#L596 | AutoAnimateOptions }
 * @param animationTargets - A map of input types and an array of their sections that should be animated.
 *
 * @returns
 * {@link @formkit/core#FormKitPlugin | FormKitPlugin}
 *
 * @public
 */
export function createAutoAnimatePlugin(
  options?: AutoAnimateOptions,
  animationTargets: Record<string, string[]> = {}
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
                let instanceId: boolean | string = true

                // If we have explicit autoAnimate meta set, use that
                if (section?.meta?.autoAnimate) {
                  isAnimationTarget = true

                  if (typeof section.meta.autoAnimate === 'object') {
                    const newOptions = Object.assign(
                      {},
                      options,
                      section.meta.autoAnimate
                    )
                    instanceId = `${node.props.id}-${autoAnimateOptionsId++}`
                    optionOverrides.set(instanceId, newOptions)
                  }
                }

                // if didn't have meta but we have a section name, check if it's a known animation target
                if (
                  !isAnimationTarget &&
                  sectionName &&
                  typeof sectionName === 'string'
                ) {
                  if (
                    animationTargets.global?.includes(sectionName) ||
                    animationTargets[node.props.type]?.includes(sectionName)
                  ) {
                    isAnimationTarget = true
                  }
                }

                // bail if we we're not a match
                if (!isAnimationTarget) return

                // add the auto-animate attribute which our observer will pick up
                if (!section?.attrs) {
                  section.attrs = { 'data-auto-animate': instanceId }
                } else {
                  Object.assign(section.attrs, {
                    'data-auto-animate': instanceId,
                  })
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
