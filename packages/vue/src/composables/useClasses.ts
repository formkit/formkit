import { watchEffect, reactive, Ref } from 'vue'
import { createObserver } from '@formkit/observer'
import {
  createClasses,
  generateClassList,
  FormKitNode,
  FormKitClasses,
} from '@formkit/core'
import { has } from '@formkit/utils'

export default function useClasses(
  node: FormKitNode,
  propClasses: Ref<
    | Record<string, string | Record<string, boolean> | FormKitClasses>
    | undefined
  >
): Record<string, string | null> {
  /* Splits Classes object into discrete props for each key */
  watchEffect(() => {
    if (propClasses.value) {
      Object.keys(propClasses.value).forEach((key) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        node.props[`_${key}Class`] = propClasses.value![key]
      })
    }
  })

  const cachedClasses = reactive({})
  const classes = new Proxy(cachedClasses as Record<PropertyKey, string>, {
    get(...args) {
      const [target, property] = args
      let className = Reflect.get(...args)
      if (typeof property === 'string') {
        if (!has(target, property) && !property.startsWith('__v_')) {
          const observedNode = createObserver(node)
          observedNode.watch((node) => {
            const rootClasses =
              typeof node.config.rootClasses === 'function'
                ? node.config.rootClasses(property, node)
                : {}
            const globalConfigClasses = node.config.classes
              ? createClasses(property, node, node.config.classes[property])
              : {}
            const classesPropClasses = createClasses(
              property,
              node,
              node.props[`_${property}Class`]
            )
            const compositionPropClasses = createClasses(
              property,
              node,
              node.props[`${property}Class`]
            )
            className = generateClassList(
              node,
              property,
              rootClasses,
              globalConfigClasses,
              classesPropClasses,
              compositionPropClasses
            )
            target[property] = className
          })
        }
      }
      return className
    },
  })

  return classes
}
