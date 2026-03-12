import { error, FormKitNode, FormKitSchemaDefinition } from '@formkit/core'
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
  useRef,
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

/**
 * The public prop surface for the React FormKit component.
 *
 * The `type` prop selects the active input definition, which in turn narrows
 * the rest of the available props and slots.
 *
 * @public
 */
export type FormKitComponentProps<Props extends FormKitInputs<Props>> = Props & {
  children?: ReactNode | ((data?: Record<string, any>) => ReactNode)
  slots?: FormKitRenderSlots
  onNode?: (node: FormKitNode) => void
  onInput?: (...args: any[]) => void
  onInputRaw?: (...args: any[]) => void
  onUpdateModelValue?: (value: unknown) => void
  onChange?: (value: unknown, node: FormKitNode) => void
  [key: string]: any
}

/**
 * The public React FormKit component signature.
 *
 * @public
 */
export type FormKitComponent = <Props extends FormKitInputs<Props>>(
  props: FormKitComponentProps<Props> & { ref?: Ref<FormKitNode | undefined> }
) => ReactElement | null

let currentSchemaNode: FormKitNode | null = null

export const getCurrentSchemaNode = () => currentSchemaNode

function resolveSchemaState(
  node: FormKitNode,
  sectionsSchema?: Record<string, unknown>
): {
  schema: FormKitSchemaDefinition
  memoKey: string | undefined
} {
  const schemaDefinition = node.props.definition?.schema as
    | FormKitSchemaDefinition
    | ((sectionsSchema?: Record<string, unknown>) => FormKitSchemaDefinition)
    | undefined

  if (!schemaDefinition) error(601, node)

  if (typeof schemaDefinition === 'function') {
    currentSchemaNode = node
    const generated = schemaDefinition({ ...(sectionsSchema || {}) })
    currentSchemaNode = null
    const schemaMemoKey =
      node.props.definition?.schemaMemoKey ||
      ('memoKey' in schemaDefinition &&
      typeof schemaDefinition.memoKey === 'string'
        ? schemaDefinition.memoKey
        : node.props.type)

    return {
      schema: generated,
      memoKey: `${schemaMemoKey}${JSON.stringify(sectionsSchema || {})}`,
    }
  }

  return {
    schema: schemaDefinition,
    memoKey: node.props.definition?.schemaMemoKey,
  }
}

function hasRenderableChildren(
  children: ReactNode | ((data?: Record<string, any>) => ReactNode)
) {
  const isRenderableObject = (value: unknown) => {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      '$$typeof' in (value as Record<string, unknown>)
    )
  }

  return (
    typeof children === 'function' ||
    (children !== undefined &&
      children !== null &&
      (typeof children !== 'object' ||
        Array.isArray(children) ||
        isRenderableObject(children)))
  )
}

function useStableSlots(
  children: ReactNode | ((data?: Record<string, any>) => ReactNode),
  explicitSlots?: FormKitRenderSlots
) {
  const latestChildren = useRef(children)
  const latestExplicitSlots = useRef(explicitSlots)

  latestChildren.current = children
  latestExplicitSlots.current = explicitSlots

  const explicitSlotNames = Object.keys(explicitSlots || {})
    .filter((slotName) => typeof explicitSlots?.[slotName] === 'function')
    .sort()
  const shouldExposeDefaultSlot =
    typeof explicitSlots?.default === 'function' ||
    hasRenderableChildren(children)

  return useMemo(() => {
    const slotNames = new Set(explicitSlotNames)
    if (shouldExposeDefaultSlot) {
      slotNames.add('default')
    }

    const stableSlots: FormKitRenderSlots = {}

    for (const slotName of slotNames) {
      stableSlots[slotName] = (data?: Record<string, any>) => {
        const currentExplicitSlots = latestExplicitSlots.current || {}
        const explicitSlot = currentExplicitSlots[slotName]

        if (typeof explicitSlot === 'function') {
          return explicitSlot(data)
        }

        if (slotName !== 'default') {
          return null
        }

        const currentChildren = latestChildren.current
        if (typeof currentChildren === 'function') {
          return currentChildren(data)
        }

        return hasRenderableChildren(currentChildren)
          ? Children.toArray(currentChildren as ReactNode)
          : null
      }
    }

    return stableSlots
  }, [explicitSlotNames.join('|'), shouldExposeDefaultSlot])
}

function FormKitImpl<Props extends FormKitInputs<Props>>(
  props: FormKitComponentProps<Props>,
  ref: Ref<FormKitNode | undefined>
): ReactElement | null {
  const slots = useStableSlots(props.children, props.slots)

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

  const [schema, setSchema] = useState<FormKitSchemaDefinition>(
    () => resolveSchemaState(node, props.sectionsSchema).schema
  )
  const [memoKey, setMemoKey] = useState<string | undefined>(
    () => resolveSchemaState(node, props.sectionsSchema).memoKey
  )

  const generateSchema = useCallback(() => {
    const nextState = resolveSchemaState(node, props.sectionsSchema)
    setSchema(nextState.schema)
    setMemoKey((existing) =>
      existing === nextState.memoKey ? existing : nextState.memoKey
    )
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
    FormKit,
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
      {
        value: () => {
          /* noop */
        },
      },
      createElement(parentSymbol.Provider, { value: node }, rendered)
    )
  }

  return rendered
}

const formkitForwardRef = forwardRef(FormKitImpl)
formkitForwardRef.displayName = 'FormKit'

/**
 * The root FormKit React component. Use it to render any FormKit input:
 *
 * ```tsx
 * <FormKit type="text" label="Name" />
 * ```
 *
 * @public
 */
export const FormKit: <Props extends FormKitInputs<Props>>(
  props: FormKitComponentProps<Props> & { ref?: Ref<FormKitNode | undefined> }
) => ReactElement | null = memo(formkitForwardRef) as unknown as FormKitComponent

export type FormKitSetupContext<Props extends FormKitInputs<Props>> = {
  props: Props
  slots: Slots<Props>
  emit: (...args: any[]) => void
}

export default FormKit
export { parentSymbol, componentSymbol }
