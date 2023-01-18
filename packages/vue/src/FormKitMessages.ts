import { defineComponent, PropType, computed, inject, watch, h } from 'vue'
import { createSection } from '@formkit/inputs'
import {
  FormKitNode,
  FormKitSchemaNode,
  FormKitSchemaCondition,
} from '@formkit/core'
import { parentSymbol } from './FormKit'
import FormKitSchema from './FormKitSchema'
import { undefine } from '@formkit/utils'

/**
 * @internal
 */
const messages = createSection(
  'messages',
  () => ({
    $el: 'ul',
    if: '$fns.length($messages)',
  }),
  true
)

/**
 * @internal
 */
const message = createSection('message', () => ({
  $el: 'li',
  for: ['message', '$messages'],
  attrs: {
    key: '$message.key',
    id: `$id + '-' + $message.key`,
    'data-message-type': '$message.type',
  },
}))

/**
 * The actual schema to render for the messages.
 */
const definition = messages(message('$message.value'))

/**
 * Renders the messages for a parent node, or any node explicitly passed to it.
 * @public
 */
export const FormKitMessages = defineComponent({
  props: {
    node: {
      type: Object as PropType<FormKitNode> | undefined,
      required: false,
    },
    sectionsSchema: {
      type: Object as PropType<
        Record<string, Partial<FormKitSchemaNode> | FormKitSchemaCondition>
      >,
      default: {},
    },
    defaultPosition: {
      type: [String, Boolean] as PropType<
        'true' | 'false' | boolean | undefined
      >,
      default: false,
    },
  },
  setup(props, context) {
    const node = computed<FormKitNode | undefined>(() => {
      return props.node || inject(parentSymbol, undefined)
    })
    watch(
      node,
      () => {
        if (node.value?.context && !undefine(props.defaultPosition)) {
          node.value.context.defaultMessagePlacement = false
        }
      },
      { immediate: true }
    )
    const schema = definition(props.sectionsSchema || {})
    const data = computed(() => {
      return {
        messages: node.value?.context?.messages || {},
        fns: node.value?.context?.fns || {},
        classes: node.value?.context?.classes || {},
      }
    })
    return () =>
      node.value?.context
        ? h(FormKitSchema, { schema, data: data.value }, { ...context.slots })
        : null
  },
})
