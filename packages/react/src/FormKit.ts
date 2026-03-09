import {
  error,
  FormKitNode,
  FormKitSchemaDefinition,
} from '@formkit/core'
import {
  Children,
  ComponentType,
  ReactElement,
  ReactNode,
  Ref,
  createElement,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  memo,
  useMemo,
  useState,
} from 'react'
import { FormKitSchema } from './FormKitSchema'
import { FormKitInputs, FormKitInputSlots, InputType } from '@formkit/inputs'
import { useInput } from './composables/useInput'
import { componentSymbol, parentSymbol } from './context'
import { useReactiveStore } from './reactiveStore'

export type Slots<Props extends FormKitInputs<Props>> =
  InputType<Props> extends keyof FormKitInputSlots<Props>
    ? FormKitInputSlots<Props>[InputType<Props>]
    : {}

export interface FormKitRenderSlots {
  [index: string]: (data?: Record<string, any>) => ReactNode
}

export type FormKitComponentProps = FormKitInputs<any> & {
  children?: ReactNode | ((data?: Record<string, any>) => ReactNode)
  slots?: FormKitRenderSlots
  onNode?: (node: FormKitNode) => void
  onInput?: (...args: any[]) => void
  onInputRaw?: (...args: any[]) => void
  onUpdateModelValue?: (value: unknown) => void
  onChange?: (value: unknown, node: FormKitNode) => void
  [key: string]: any
}

export type FormKitComponent = (
  props: FormKitComponentProps & { ref?: Ref<FormKitNode | undefined> }
) => ReactElement | null

let currentSchemaNode: FormKitNode | null = null

export const getCurrentSchemaNode = () => currentSchemaNode

function toSlots(
  children: ReactNode | ((data?: Record<string, any>) => ReactNode),
  explicitSlots?: FormKitRenderSlots
): FormKitRenderSlots {
  const slots: FormKitRenderSlots = { ...(explicitSlots || {}) }
  const isRenderableObject = (value: unknown) => {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      '$$typeof' in (value as Record<string, unknown>)
    )
  }
  if (typeof children === 'function') {
    slots.default = children
  } else if (
    children !== undefined &&
    children !== null &&
    (typeof children !== 'object' || Array.isArray(children) || isRenderableObject(children))
  ) {
    slots.default = () => Children.toArray(children as ReactNode)
  }
  return slots
}

function FormKitImpl(
  props: FormKitComponentProps,
  ref: Ref<FormKitNode | undefined>
): ReactElement | null {
  const slots = useMemo(
    () => toSlots(props.children, props.slots),
    [props.children, props.slots]
  )

  const node = useInput({ ...props, slots } as any)

  if (!node.props.definition) error(600, node)

  useImperativeHandle(ref, () => node, [node])

  useEffect(() => {
    if (typeof props.onNode === 'function') {
      props.onNode(node)
    }
  }, [node, props.onNode])

  useReactiveStore(node.props.definition.component ? node.context : undefined)

  if (node.props.definition.component) {
    return createElement(node.props.definition.component as any, {
      context: node.context,
      slots,
    })
  }

  const [schema, setSchema] = useState<FormKitSchemaDefinition>([])
  const [memoKey, setMemoKey] = useState<string | undefined>(
    node.props.definition?.schemaMemoKey
  )

  const generateSchema = useCallback(() => {
    const schemaDefinition = node.props.definition?.schema as
      | FormKitSchemaDefinition
      | ((
          sectionsSchema?: Record<string, unknown>
        ) => FormKitSchemaDefinition)
      | undefined

    if (!schemaDefinition) error(601, node)

    if (typeof schemaDefinition === 'function') {
      currentSchemaNode = node
      const generated = schemaDefinition({ ...(props.sectionsSchema || {}) })
      currentSchemaNode = null
      setSchema(generated)
      const schemaMemoKey =
        node.props.definition?.schemaMemoKey ||
        ('memoKey' in schemaDefinition &&
        typeof schemaDefinition.memoKey === 'string'
          ? schemaDefinition.memoKey
          : node.props.type)
      const nextMemoKey = `${schemaMemoKey}${JSON.stringify(props.sectionsSchema || {})}`
      setMemoKey((existing) => (existing === nextMemoKey ? existing : nextMemoKey))
    } else {
      setSchema(schemaDefinition)
    }
  }, [node, props.sectionsSchema])

  useEffect(() => {
    generateSchema()
  }, [generateSchema])

  useEffect(() => {
    const receipt = node.on('schema', () => {
      setMemoKey((existing) => `${existing || ''}♻️`)
      generateSchema()
    })
    return () => {
      node.off(receipt)
    }
  }, [generateSchema, node])

  useEffect(() => {
    node.emit('mounted')
  }, [node])

  const definitionLibrary = node.props.definition.library as
    | Record<string, ComponentType<any>>
    | undefined

  const library = {
    FormKit: formkitComponent,
    ...definitionLibrary,
    ...(props.library ?? {}),
  }

  const rendered = createElement(FormKitSchema, {
    schema,
    data: node.context,
    library,
    memoKey,
    slots,
  })

  if (node.type !== 'input') {
    return createElement(
      componentSymbol.Provider,
      { value: () => {
        /* noop */
      } },
      createElement(parentSymbol.Provider, { value: node }, rendered)
    )
  }

  return rendered
}

const formkitForwardRef = forwardRef(FormKitImpl)
formkitForwardRef.displayName = 'FormKit'

export const formkitComponent = memo(formkitForwardRef) as unknown as FormKitComponent

export type FormKitSetupContext<Props extends FormKitInputs<Props>> = {
  props: Props
  slots: Slots<Props>
  emit: (...args: any[]) => void
}

export default formkitComponent
export { parentSymbol, componentSymbol }
