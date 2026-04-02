import {
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { createSection, localize } from '@formkit/inputs'
import { token } from '@formkit/utils'
import {
  FormKitNode,
  FormKitSchemaNode,
  FormKitSchemaCondition,
  FormKitFrameworkContext,
} from '@formkit/core'
import FormKitSchema from './FormKitSchema'
import { parentSymbol } from './context'
import { useReactiveStore } from './reactiveStore'

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

const messages = createSection('messages', () => ({
  $el: 'ul',
  if: '$summaries.length && $showSummaries',
}))

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

export interface FormKitSummaryProps {
  node?: FormKitNode
  forceShow?: boolean
  sectionsSchema?: Record<
    string,
    Partial<FormKitSchemaNode> | FormKitSchemaCondition
  >
  onShow?: (summaries: Array<FormKitSummaryMessage>) => void
}

export function FormKitSummary(props: FormKitSummaryProps) {
  const id = useMemo(() => `summary-${token()}`, [])
  const inheritedNode = useContext(parentSymbol)
  const node = props.node || inheritedNode || undefined

  if (!node) {
    throw new Error(
      'FormKitSummary must have a FormKit parent or use the node prop.'
    )
  }

  useReactiveStore(node.context)

  const [summaryContexts, setSummaryContexts] = useState<
    Array<FormKitFrameworkContext>
  >([])
  const [showSummaries, setShowSummaries] = useState(false)

  useEffect(() => {
    localize('summaryHeader', 'There were errors in your form.')(node)
  }, [node])

  useEffect(() => {
    const addContexts = () => {
      const contexts: Array<FormKitFrameworkContext> = []
      node.walk((child) => {
        if (child.context) contexts.push(child.context)
      })
      setSummaryContexts(contexts)
    }

    const submitReceipt = node.on('submit-raw', () => {
      addContexts()
      setShowSummaries(true)
    })

    const childReceipt = node.on('child', addContexts)

    addContexts()

    return () => {
      node.off(submitReceipt)
      node.off(childReceipt)
    }
  }, [node])

  const summaries = useMemo((): Array<FormKitSummaryMessage> => {
    const summarizedMessages: Array<FormKitSummaryMessage> = []
    summaryContexts.forEach((context) => {
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
  }, [summaryContexts])

  useEffect(() => {
    if (showSummaries && summaries.length) {
      props.onShow?.(summaries)
      if (typeof window !== 'undefined') {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
        if (summaries[0]) {
          document.getElementById(summaries[0].key)?.focus()
        }
      }
    }
  }, [id, props.onShow, showSummaries, summaries])

  function jumpLink(e: MouseEvent) {
    const target = e.target
    if (target instanceof HTMLAnchorElement) {
      e.preventDefault()
      const targetId = target.getAttribute('href')?.substring(1)
      if (targetId) {
        document.getElementById(targetId)?.scrollIntoView({
          behavior: 'smooth',
        })
        document.getElementById(targetId)?.focus()
      }
    }
  }

  const schema = useMemo(
    () => definition(props.sectionsSchema || {}),
    [props.sectionsSchema]
  )

  const data = {
    id,
    fns: node.context?.fns || {},
    classes: node.context?.classes || {},
    summaries,
    showSummaries: props.forceShow || showSummaries,
    summaryHeader: node.context?.ui?.summaryHeader?.value || '',
    jumpLink,
  }

  if (!node.context) return null

  return createElement(FormKitSchema, {
    schema,
    data,
  })
}
