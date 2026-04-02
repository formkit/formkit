import { ReactNode, createElement, useContext, useEffect, useMemo } from 'react'
import { createSection } from '@formkit/inputs'
import {
  FormKitNode,
  FormKitSchemaNode,
  FormKitSchemaCondition,
} from '@formkit/core'
import { undefine } from '@formkit/utils'
import FormKitSchema from './FormKitSchema'
import { parentSymbol } from './context'
import { useReactiveStore } from './reactiveStore'

const messages = createSection('messages', () => ({
  $el: 'ul',
  if: '$fns.length($messages)',
}))

const message = createSection('message', () => ({
  $el: 'li',
  for: ['message', '$messages'],
  attrs: {
    key: '$message.key',
    id: `$id + '-' + $message.key`,
    'data-message-type': '$message.type',
  },
}))

const definition = messages(message('$message.value'))

export interface FormKitMessagesProps {
  node?: FormKitNode
  sectionsSchema?: Record<
    string,
    Partial<FormKitSchemaNode> | FormKitSchemaCondition
  >
  defaultPosition?: 'true' | 'false' | boolean | undefined
  library?: Record<string, any>
  children?: ReactNode
}

export function FormKitMessages(props: FormKitMessagesProps) {
  const inheritedNode = useContext(parentSymbol)
  const node = props.node || inheritedNode || undefined

  useReactiveStore(node?.context)

  useEffect(() => {
    if (node?.context && !undefine(props.defaultPosition)) {
      node.context.defaultMessagePlacement = false
    }
  }, [node, props.defaultPosition])

  const schema = useMemo(
    () => definition(props.sectionsSchema || {}),
    [props.sectionsSchema]
  )

  const data = {
    messages: node?.context?.messages || {},
    fns: node?.context?.fns || {},
    classes: node?.context?.classes || {},
  }

  if (!node?.context) {
    return null
  }

  return createElement(FormKitSchema, {
    schema,
    data,
    library: props.library,
  })
}
