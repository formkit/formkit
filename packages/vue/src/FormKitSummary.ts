import { defineComponent, PropType, computed, inject, h } from 'vue'
import { createSection } from '@formkit/inputs'
import { token } from '@formkit/utils'
import {
  FormKitNode,
  FormKitSchemaNode,
  FormKitSchemaCondition,
  FormKitFrameworkContext,
} from '@formkit/core'
import { parentSymbol } from './FormKit'
import FormKitSchema from './FormKitSchema'
import { ref } from 'vue'
import { localize } from '@formkit/inputs'
import { nextTick } from 'vue'

const summary = createSection('summary', () => ({
  $el: 'div',
  attrs: {
    'aria-live': 'polite',
  },
}))

const summaryInner = createSection('summaryInner', () => ({
  $el: 'div',
  if: '$summaries.length && $showSummaries',
}))

/**
 * @internal
 */
const messages = createSection('messages', () => ({
  $el: 'ul',
  if: '$summaries.length && $showSummaries',
}))

/**
 * @internal
 */
const message = createSection('message', () => ({
  $el: 'li',
  for: ['summary', '$summaries'],
  attrs: {
    key: '$summary.key',
    'data-message-type': '$summary.type',
  },
}))

const summaryHeader = createSection('summaryHeader', () => ({
  $el: 'h2',
  attrs: {
    id: '$id',
  },
}))

const messageLink = createSection('messageLink', () => ({
  $el: 'a',
  attrs: {
    id: '$summary.key',
    href: '$: "#" + $summary.id',
    onClick: '$jumpLink',
  },
}))

/**
 * The actual schema to render for the messages.
 */
const definition = summary(
  summaryInner(
    summaryHeader('$summaryHeader'),
    messages(message(messageLink('$summary.message')))
  )
)

export interface FormKitSummaryMessage {
  message: string
  id: string
  key: string
  type: string
}

/**
 * Renders the messages for a parent node, or any node explicitly passed to it.
 * @public
 */
export const FormKitSummary = defineComponent({
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
  },
  emits: {
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    show: (_summaries: Array<FormKitSummaryMessage>) => true,
  },
  setup(props, context) {
    const id = `summary-${token()}`
    const node = computed<FormKitNode | undefined>(() => {
      return props.node || inject(parentSymbol, undefined)
    })

    if (!node)
      throw new Error(
        'FormKitSummary must have a FormKit parent or use the node prop.'
      )

    const summaryContexts = ref<Array<FormKitFrameworkContext>>([])
    const showSummaries = ref(false)
    const summaries = computed((): Array<FormKitSummaryMessage> => {
      const summarizedMessages: Array<FormKitSummaryMessage> = []
      summaryContexts.value.forEach((context) => {
        for (const idx in context.messages) {
          const message = context.messages[idx]
          if (typeof message.value !== 'string') continue
          summarizedMessages.push({
            message: message.value,
            id: context.id,
            key: `${context.id}-${message.key}`,
            type: message.type,
          })
        }
      })
      return summarizedMessages
    })

    const addContexts = () => {
      summaryContexts.value = []
      node.value?.walk(
        (child) => child.context && summaryContexts.value.push(child.context)
      )
    }

    node.value?.on('submit-raw', async () => {
      addContexts()
      if (summaries.value.length === 0) return
      context.emit('show', summaries.value)
      showSummaries.value = true
      await nextTick()
      if (typeof window !== 'undefined') {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
        if (summaries.value[0]) {
          console.log(summaries.value[0])
          console.log(document.getElementById(summaries.value[0].key))
          document.getElementById(summaries.value[0].key)?.focus()
        }
      }
    })
    node.value?.on('child', addContexts)

    function jumpLink(e: MouseEvent) {
      if (e.target instanceof HTMLAnchorElement) {
        e.preventDefault()
        const id = e.target.getAttribute('href')?.substring(1)
        if (id) {
          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
          document.getElementById(id)?.focus()
        }
      }
    }

    localize('summaryHeader', 'There were errors in your form.')(node.value!)

    const schema = definition(props.sectionsSchema || {})

    const data = computed(() => {
      return {
        id,
        fns: node.value?.context?.fns || {},
        classes: node.value?.context?.classes || {},
        summaries: summaries.value,
        showSummaries: showSummaries.value,
        summaryHeader: node.value?.context?.ui?.summaryHeader?.value || '',
        jumpLink,
      }
    })
    return () =>
      node.value?.context
        ? h(FormKitSchema, { schema, data: data.value }, { ...context.slots })
        : null
  },
})
