import {
  Children,
  ComponentType,
  Fragment,
  ReactNode,
  cloneElement,
  createElement as h,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react'
import { has, isPojo } from '@formkit/utils'
import {
  FormKitSchemaAttributes,
  FormKitSchemaNode,
  isDOM,
  isConditional,
  isComponent,
  compile,
  FormKitSchemaCondition,
  FormKitSchemaAttributesCondition,
  FormKitAttributeValue,
  FormKitCompilerOutput,
  FormKitSchemaDefinition,
  getNode,
  warn,
  sugar,
} from '@formkit/core'
import FormKit from './FormKit'
import { useReactiveStore } from './reactiveStore'

export interface FormKitComponentLibrary {
  [index: string]: ComponentType<any>
}

type RenderContent = [
  condition: false | (() => any),
  element: string | ComponentType<any> | null,
  attrs: () => any,
  children: RenderChildren | null,
  alternate: RenderChildren | null,
  iterator:
    | null
    | [
        getNodeValues: () => any,
        valueName: string,
        keyName: string | null
      ],
  resolve: boolean
]

export type VirtualNode = ReactNode
export type Renderable = null | string | number | boolean | VirtualNode
export type RenderableList =
  | Renderable
  | Renderable[]
  | (Renderable | Renderable[])[]

export type RenderableSlots = Record<string, RenderableSlot>

export type RenderableSlot = (
  data?: Record<string, any>,
  key?: object,
  capturedScope?: Record<string, any>[]
) => RenderableList

interface RenderChildren {
  (iterationData?: Record<string, unknown>): RenderableList | RenderableSlots
  slot?: boolean
}

interface RenderNodes {
  (iterationData?: Record<string, unknown>): Renderable | Renderable[]
}

interface SchemaProvider {
  (
    providerCallback: SchemaProviderCallback,
    instanceKey: object
  ): RenderChildren
}

type SchemaProviderCallback = (
  requirements: string[],
  hints?: Record<string, boolean>
) => Record<string, () => any>

type ProviderRegistry = ((
  providerCallback: SchemaProviderCallback,
  key: object
) => void)[]

const memo: Record<string, [RenderChildren, ProviderRegistry]> = {}
const memoKeys: Record<string, number> = {}

let instanceKey: object

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const instanceScopes = new WeakMap<object, Record<string, any>[]>()

const raw = '__raw__'
const isClassProp = /[a-zA-Z0-9\-][cC]lass$/
const booleanAttrs = new Set([
  'checked',
  'disabled',
  'hidden',
  'multiple',
  'readOnly',
  'required',
  'selected',
])
const reactControlledNoop = () => {
  /* React controlled-input compatibility noop. */
}
const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect
const bridgedEventHandlerCache = new WeakMap<
  (...args: any[]) => any,
  (...args: any[]) => any
>()
const beforeInputEventHandlerCache = new WeakMap<
  (...args: any[]) => any,
  (...args: any[]) => any
>()
const symbolElementKeys = new Map<symbol, string>()
let nextSymbolElementKey = 0
const domPropAliases: Record<string, string> = {
  autocomplete: 'autoComplete',
  autocapitalize: 'autoCapitalize',
  contenteditable: 'contentEditable',
  for: 'htmlFor',
  inputmode: 'inputMode',
  maxlength: 'maxLength',
  minlength: 'minLength',
  readonly: 'readOnly',
  spellcheck: 'spellCheck',
  srcset: 'srcSet',
  tabindex: 'tabIndex',
}
const reactEventSuffixes: Record<string, string> = {
  beforeinput: 'BeforeInput',
  blur: 'Blur',
  change: 'Change',
  click: 'Click',
  dblclick: 'DoubleClick',
  drag: 'Drag',
  dragend: 'DragEnd',
  dragenter: 'DragEnter',
  dragleave: 'DragLeave',
  dragover: 'DragOver',
  dragstart: 'DragStart',
  drop: 'Drop',
  focus: 'Focus',
  focusin: 'Focus',
  focusout: 'Blur',
  input: 'Input',
  keydown: 'KeyDown',
  keypress: 'KeyPress',
  keyup: 'KeyUp',
  mousedown: 'MouseDown',
  mouseenter: 'MouseEnter',
  mouseleave: 'MouseLeave',
  mousemove: 'MouseMove',
  mouseout: 'MouseOut',
  mouseover: 'MouseOver',
  mouseup: 'MouseUp',
  pointerdown: 'PointerDown',
  pointerenter: 'PointerEnter',
  pointerleave: 'PointerLeave',
  pointermove: 'PointerMove',
  pointerup: 'PointerUp',
  scroll: 'Scroll',
  touchcancel: 'TouchCancel',
  touchend: 'TouchEnd',
  touchmove: 'TouchMove',
  touchstart: 'TouchStart',
  wheel: 'Wheel',
}

function toCamelStyleKey(key: string): string {
  if (key.startsWith('--')) return key
  return key.replace(/-([a-z])/g, (_, segment) => segment.toUpperCase())
}

function normalizeStyleObject(style: unknown): unknown {
  if (!style || typeof style !== 'object' || Array.isArray(style)) return style
  return Object.keys(style as Record<string, unknown>).reduce(
    (normalized, key) => {
      normalized[toCamelStyleKey(key)] = (style as Record<string, unknown>)[key]
      return normalized
    },
    {} as Record<string, unknown>
  )
}

function normalizeEventPropName(prop: string): string | null {
  if (!prop.startsWith('on') || prop.length < 3) return null
  let raw = prop.slice(2).replace(/[-_]/g, '')
  if (!raw) return null

  raw = raw.replace(/Passive$/i, '')
  const suffix = reactEventSuffixes[raw.toLowerCase()]
  if (suffix) return `on${suffix}`

  if (/^on[A-Z]/.test(prop)) return prop
  return `on${raw[0].toUpperCase()}${raw.slice(1)}`
}

function normalizeDomPropName(prop: string): string {
  if (prop in domPropAliases) return domPropAliases[prop]
  if (prop.startsWith('aria-')) return prop.toLowerCase()
  return prop
}

function pruneInvalidEventHandlers(attrs: Record<string, any>) {
  for (const key in attrs) {
    if (!/^on[A-Z]/.test(key)) continue
    if (typeof attrs[key] !== 'function') {
      delete attrs[key]
    }
  }
}

function bridgeReactEvent(event: unknown) {
  if (!event || typeof event !== 'object') return event
  const synthetic = event as Record<string, any>
  const native = synthetic.nativeEvent
  if (!native || typeof native !== 'object') return event

  const setIfMissing = (key: string, value: unknown) => {
    if (synthetic[key] !== undefined || value === undefined) return
    try {
      synthetic[key] = value
    } catch {
      /* Synthetic event field is read-only. */
    }
  }

  setIfMissing('data', native.data)
  setIfMissing('inputType', native.inputType)
  setIfMissing('pointerType', native.pointerType)
  setIfMissing('clientX', native.clientX)
  setIfMissing('clientY', native.clientY)
  setIfMissing('changedTouches', native.changedTouches)
  setIfMissing('touches', native.touches)

  if (
    synthetic.inputType === undefined &&
    synthetic.type === 'beforeinput'
  ) {
    const inferredInputType =
      typeof synthetic.data === 'string' && synthetic.data.length
        ? 'insertText'
        : ''
    setIfMissing('inputType', inferredInputType)
  }

  return synthetic
}

function asBridgedEventHandler(handler: (...args: any[]) => any) {
  const cached = bridgedEventHandlerCache.get(handler)
  if (cached) return cached
  const wrapped = (event: unknown, ...args: any[]) => {
    return handler(bridgeReactEvent(event), ...args)
  }
  bridgedEventHandlerCache.set(handler, wrapped)
  return wrapped
}

function asBeforeInputEventHandler(handler: (...args: any[]) => any) {
  const cached = beforeInputEventHandlerCache.get(handler)
  if (cached) return cached
  const wrapped = (event: unknown, ...args: any[]) => {
    const nativeEvent =
      event &&
      typeof event === 'object' &&
      'nativeEvent' in (event as Record<string, unknown>)
        ? (event as Record<string, any>).nativeEvent
        : event

    if (nativeEvent && typeof nativeEvent === 'object') {
      const native = nativeEvent as Record<string, any>
      if (native.inputType === undefined) {
        native.inputType =
          typeof native.data === 'string' && native.data.length
            ? 'insertText'
            : ''
      }
      return handler(nativeEvent, ...args)
    }

    return handler(event, ...args)
  }
  beforeInputEventHandlerCache.set(handler, wrapped)
  return wrapped
}

function normalizeDomEventHandlers(attrs: Record<string, any>) {
  for (const key in attrs) {
    if (!/^on[A-Z]/.test(key)) continue
    if (typeof attrs[key] === 'function') {
      if (key === 'onBeforeInput') {
        attrs[key] = asBeforeInputEventHandler(attrs[key])
        continue
      }
      attrs[key] = asBridgedEventHandler(attrs[key])
    }
  }
}

function normalizeElementKey(attrs: Record<string, any>) {
  if (!('key' in attrs)) return
  const key = attrs.key
  if (typeof key === 'symbol') {
    if (!symbolElementKeys.has(key)) {
      symbolElementKeys.set(key, `fk-${nextSymbolElementKey++}`)
    }
    attrs.key = symbolElementKeys.get(key)
    return
  }
  if (
    key != null &&
    typeof key !== 'string' &&
    typeof key !== 'number' &&
    typeof key !== 'bigint'
  ) {
    attrs.key = String(key)
  }
}

function normalizeBooleanAttr(value: unknown) {
  if (value === 'false') return false
  if (value === 'true' || value === '') return true
  return value
}

function isDomValueManagedControl(
  element: string,
  attrs: Record<string, any>
): boolean {
  if (!('value' in attrs)) return false
  if (element === 'textarea') return true
  if (element !== 'input') return false

  const type = String(attrs.type ?? 'text').toLowerCase()
  return ![
    'button',
    'checkbox',
    'file',
    'hidden',
    'image',
    'radio',
    'reset',
    'submit',
  ].includes(type)
}

interface DomValueHostProps {
  attrs: Record<string, any>
  children?: ReactNode
  element: 'input' | 'textarea'
}

function DomValueHost({ attrs, children, element }: DomValueHostProps) {
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)
  const { defaultValue, value, ...passthrough } = attrs
  const initialValue =
    value !== undefined ? value : defaultValue !== undefined ? defaultValue : ''
  const initialValueRef = useRef(initialValue)

  useIsomorphicLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const nextValue = value == null ? '' : String(value)
    if (el.value === nextValue) return

    const isActive =
      typeof document !== 'undefined' && document.activeElement === el
    const selectionStart = isActive ? el.selectionStart : null
    const selectionEnd = isActive ? el.selectionEnd : null
    const selectionDirection = isActive ? el.selectionDirection : null

    el.value = nextValue

    if (selectionStart !== null && selectionEnd !== null) {
      const clampedStart = Math.min(selectionStart, nextValue.length)
      const clampedEnd = Math.min(selectionEnd, nextValue.length)
      el.setSelectionRange(
        clampedStart,
        clampedEnd,
        selectionDirection ?? undefined
      )
    }
  }, [value])

  return h(
    element,
    {
      ...passthrough,
      defaultValue: initialValueRef.current,
      ref,
    },
    children
  )
}

function normalizeSelectOptions(
  node: ReactNode,
  selected: unknown[]
): ReactNode {
  if (Array.isArray(node)) {
    return node.map((child) => normalizeSelectOptions(child, selected))
  }
  if (!isValidElement(node)) return node

  const props = (node.props || {}) as Record<string, any>
  let nextProps: Record<string, any> | undefined

  if (typeof node.type === 'string' && node.type === 'option') {
    if (props['data-fk-selected']) selected.push(props.value)
    if ('data-fk-selected' in props) {
      nextProps = { ...props }
      delete nextProps['data-fk-selected']
    }
  }

  if ('children' in props && props.children !== undefined) {
    const nextChildren = Children.map(props.children as ReactNode, (child) =>
      normalizeSelectOptions(child, selected)
    )
    if (nextChildren !== props.children) {
      nextProps = {
        ...(nextProps || props),
        children: nextChildren,
      }
    }
  }

  if (!nextProps) return node
  return cloneElement(node, nextProps)
}

function resolveIterationKey(
  node: ReactNode,
  fallback: string | number
): string | number {
  if (isValidElement(node) && node.key != null) {
    return String(node.key)
  }

  return fallback
}

function getValue(
  set: (false | Record<string, any>)[] | Record<string, any>,
  path: string[]
): any {
  if (Array.isArray(set)) {
    for (const subset of set) {
      const value = subset !== false && getValue(subset, path)
      if (value !== undefined) return value
    }
    return undefined
  }

  let foundValue: any = undefined
  let obj: unknown = set

  for (const i in path) {
    const key = path[i]
    if (typeof obj !== 'object' || obj === null) {
      foundValue = undefined
      break
    }
    const currentValue: unknown = (obj as Record<string, any>)[key]
    if (Number(i) === path.length - 1 && currentValue !== undefined) {
      foundValue =
        typeof currentValue === 'function'
          ? currentValue.bind(obj)
          : currentValue
      break
    }
    obj = currentValue
  }
  return foundValue
}

function get(id?: string) {
  if (typeof id !== 'string') return warn(650)
  const root = getNode(id)
  return root ? root.context : null
}

function normalizeAttrs(
  element: string | ComponentType<any> | null,
  attrs: FormKitSchemaAttributes | null
): any {
  if (!attrs || typeof attrs !== 'object') return attrs

  const normalized: Record<string, any> = Array.isArray(attrs)
    ? ([...attrs] as any)
    : { ...attrs }

  if ('class' in normalized && !('className' in normalized)) {
    normalized.className = normalized.class
    delete normalized.class
  }

  if ('for' in normalized && !('htmlFor' in normalized)) {
    normalized.htmlFor = normalized.for
    delete normalized.for
  }

  if ('tabindex' in normalized && !('tabIndex' in normalized)) {
    normalized.tabIndex = normalized.tabindex
    delete normalized.tabindex
  }

  if ('innerHTML' in normalized) {
    normalized.dangerouslySetInnerHTML = {
      __html: String(normalized.innerHTML ?? ''),
    }
    delete normalized.innerHTML
  }

  for (const attr in normalized) {
    const domProp = normalizeDomPropName(attr)
    const eventProp = normalizeEventPropName(domProp)
    const normalizedName = eventProp || domProp
    if (normalizedName !== attr) {
      normalized[normalizedName] = normalized[attr]
      delete normalized[attr]
    }
  }

  if ('style' in normalized) {
    normalized.style = normalizeStyleObject(normalized.style)
  }

  normalizeElementKey(normalized)

  if (typeof element === 'string') {
    const className =
      typeof normalized.className === 'string' ? normalized.className : ''
    const isFormKitIcon =
      className.includes('formkit-icon') || className.includes('formkitIcon')
    if (isFormKitIcon && typeof normalized.onClick !== 'function') {
      // Keep non-interactive schema icons from intercepting checkbox/radio label
      // clicks (notably decorator SVGs in Chromium/React).
      const existingStyle =
        normalized.style && typeof normalized.style === 'object'
          ? normalized.style
          : {}
      normalized.style = {
        ...existingStyle,
        pointerEvents: 'none',
      }
    }

    for (const attr of booleanAttrs) {
      if (attr in normalized) {
        normalized[attr] = normalizeBooleanAttr(normalized[attr])
      }
    }

    if (element === 'input') {
      const type = String(normalized.type ?? 'text')
      const checkable = type === 'checkbox' || type === 'radio'
      const controlled = checkable ? 'checked' in normalized : 'value' in normalized
      const domValueManaged = isDomValueManagedControl(element, normalized)
      if (
        controlled &&
        !domValueManaged &&
        typeof normalized.onChange !== 'function'
      ) {
        if (checkable) {
          if (typeof normalized.onInput === 'function') {
            // React checkboxes/radios are reliably driven by change events.
            normalized.onChange = normalized.onInput
            delete normalized.onInput
          } else {
            normalized.onChange = reactControlledNoop
          }
        } else {
          if (typeof normalized.onInput === 'function') {
            normalized.onChange = reactControlledNoop
          } else {
            normalized.onChange = reactControlledNoop
          }
        }
      }
      if (
        !checkable &&
        type !== 'file' &&
        'value' in normalized &&
        normalized.value == null
      ) {
        normalized.value = ''
      }
    } else if (element === 'select') {
      if (
        'value' in normalized &&
        typeof normalized.onChange !== 'function' &&
        typeof normalized.onInput === 'function'
      ) {
        normalized.onChange = reactControlledNoop
      }
      if (normalized.value === null) normalized.value = ''
    } else if (element === 'textarea') {
      if ('value' in normalized && normalized.value == null) {
        normalized.value = ''
      }
    } else if (element === 'option') {
      if ('selected' in normalized) {
        if (normalized.selected) normalized['data-fk-selected'] = true
        delete normalized.selected
      }
    }
  }

  pruneInvalidEventHandlers(normalized)
  if (typeof element === 'string') {
    normalizeDomEventHandlers(normalized)
  }

  return normalized
}

function parseSchema(
  library: FormKitComponentLibrary,
  schema: FormKitSchemaNode | FormKitSchemaNode[],
  memoKey?: string
): SchemaProvider {
  function parseCondition(
    lib: FormKitComponentLibrary,
    node: FormKitSchemaCondition
  ): [RenderContent[0], RenderContent[3], RenderContent[4]] {
    const condition = provider(compile(node.if), { if: true })
    const children = createElements(lib, node.then)
    const alternate = node.else ? createElements(lib, node.else) : null
    return [condition, children, alternate]
  }

  function parseConditionAttr(
    attr: FormKitSchemaAttributesCondition,
    _default: FormKitAttributeValue
  ): () => any {
    const condition = provider(compile(attr.if))
    let b: () => FormKitAttributeValue = () => _default
    let a: () => FormKitAttributeValue = () => _default

    if (typeof attr.then === 'object') {
      a = parseAttrs(attr.then, undefined)
    } else if (typeof attr.then === 'string' && attr.then?.startsWith('$')) {
      a = provider(compile(attr.then))
    } else {
      a = () => attr.then
    }

    if (has(attr, 'else')) {
      if (typeof attr.else === 'object') {
        b = parseAttrs(attr.else)
      } else if (typeof attr.else === 'string' && attr.else?.startsWith('$')) {
        b = provider(compile(attr.else))
      } else {
        b = () => attr.else
      }
    }

    return () => (condition() ? a() : b())
  }

  function parseAttrs(
    unparsedAttrs?: FormKitSchemaAttributes | FormKitSchemaAttributesCondition,
    bindExp?: string,
    _default = {}
  ): () => any {
    const explicitAttrs = new Set(Object.keys(unparsedAttrs || {}))
    const boundAttrs = bindExp ? provider(compile(bindExp)) : () => ({})
    const staticAttrs: FormKitSchemaAttributes = {}
    const setters: Array<(obj: Record<string, any>) => void> = [
      (attrs) => {
        const bound: Record<string, any> = boundAttrs() || {}
        for (const attr in bound) {
          if (!explicitAttrs.has(attr)) {
            attrs[attr] = bound[attr]
          }
        }
      },
    ]

    if (unparsedAttrs) {
      if (isConditional(unparsedAttrs)) {
        const condition = parseConditionAttr(
          unparsedAttrs,
          _default
        ) as () => FormKitSchemaAttributes
        return condition
      }

      for (let attr in unparsedAttrs) {
        const value = unparsedAttrs[attr]
        let getAttrValue: () => any
        const isStr = typeof value === 'string'

        if (attr.startsWith(raw)) {
          attr = attr.substring(7)
          getAttrValue = () => value
        } else if (
          isStr &&
          value.startsWith('$') &&
          value.length > 1 &&
          !(value.startsWith('$reset') && isClassProp.test(attr))
        ) {
          getAttrValue = provider(compile(value))
        } else if (typeof value === 'object' && isConditional(value)) {
          getAttrValue = parseConditionAttr(value, undefined)
        } else if (typeof value === 'object' && isPojo(value)) {
          getAttrValue = parseAttrs(value)
        } else {
          getAttrValue = () => value
          staticAttrs[attr] = value
        }

        setters.push((attrs) => {
          attrs[attr] = getAttrValue()
        })
      }
    }

    if (Object.keys(staticAttrs).length === setters.length - 1) {
      return () => staticAttrs
    }

    return () => {
      const attrs = Array.isArray(unparsedAttrs) ? [] : {}
      setters.forEach((setter) => setter(attrs))
      return attrs
    }
  }

  function parseNode(
    lib: FormKitComponentLibrary,
    _node: FormKitSchemaNode
  ): RenderContent {
    let element: RenderContent[1] = null
    let attrs: () => any = () => null
    let condition: false | (() => any) = false
    let children: RenderContent[3] = null
    let alternate: RenderContent[4] = null
    let iterator: RenderContent[5] = null
    let resolve = false

    const node = sugar(_node)

    if (isDOM(node)) {
      element = node.$el
      attrs = node.$el !== 'text' ? parseAttrs(node.attrs, node.bind) : () => null
    } else if (isComponent(node)) {
      if (typeof node.$cmp === 'string') {
        if (has(lib, node.$cmp)) {
          element = lib[node.$cmp]
        } else {
          element = node.$cmp
          resolve = true
        }
      } else {
        element = node.$cmp
      }
      attrs = parseAttrs(node.props, node.bind)
    } else if (isConditional(node)) {
      ;[condition, children, alternate] = parseCondition(lib, node)
    }

    if (!isConditional(node) && 'if' in node) {
      condition = provider(compile(node.if as string))
    } else if (!isConditional(node) && element === null) {
      condition = () => true
    }

    if ('children' in node) {
      if (typeof node.children === 'string') {
        if (node.children.startsWith('$slots.')) {
          element = element === 'text' ? 'slot' : element
          children = provider(compile(node.children))
        } else if (node.children.startsWith('$') && node.children.length > 1) {
          const value = provider(compile(node.children))
          children = () => String(value())
        } else {
          children = () => String(node.children)
        }
      } else if (Array.isArray(node.children)) {
        children = createElements(lib, node.children)
      } else if (node.children) {
        const [childCondition, c, a] = parseCondition(lib, node.children)
        children = (iterationData?: Record<string, unknown>) =>
          childCondition && childCondition()
            ? c && c(iterationData)
            : a && a(iterationData)
      }
    }

    if (isComponent(node)) {
      if (children) {
        const produceChildren = children
        children = (iterationData?: Record<string, unknown>) => {
          return {
            default(
              slotData?: Record<string, any>,
              key?: object,
              capturedScope?: Record<string, any>[]
            ): RenderableList {
              const currentKey = instanceKey
              if (key) instanceKey = key

              const scopeItemsAdded = capturedScope?.length || 0
              if (capturedScope) {
                for (let i = capturedScope.length - 1; i >= 0; i--) {
                  instanceScopes.get(instanceKey)?.unshift(capturedScope[i])
                }
              }

              if (iterationData)
                instanceScopes.get(instanceKey)?.unshift(iterationData)
              if (slotData) instanceScopes.get(instanceKey)?.unshift(slotData)

              const c = produceChildren(iterationData)

              if (slotData) instanceScopes.get(instanceKey)?.shift()
              if (iterationData) instanceScopes.get(instanceKey)?.shift()
              for (let i = 0; i < scopeItemsAdded; i++) {
                instanceScopes.get(instanceKey)?.shift()
              }

              instanceKey = currentKey
              return c as RenderableList
            },
          }
        }
        children.slot = true
      } else {
        children = () => ({})
      }
    }

    if ('for' in node && node.for) {
      const values = node.for.length === 3 ? node.for[2] : node.for[1]
      const getValues =
        typeof values === 'string' && values.startsWith('$')
          ? provider(compile(values))
          : () => values
      iterator = [
        getValues,
        node.for[0],
        node.for.length === 3 ? String(node.for[1]) : null,
      ]
    }

    return [condition, element, attrs, children, alternate, iterator, resolve]
  }

  function createSlots(
    children: RenderChildren,
    iterationData?: Record<string, unknown>
  ): RenderableSlots | null {
    const slots = children(iterationData) as RenderableSlots
    const currentKey = instanceKey
    const capturedScope = instanceScopes.get(currentKey)?.slice() || []

    return Object.keys(slots).reduce((allSlots, slotName) => {
      const slotFn = slots && slots[slotName]
      allSlots[slotName] = (data?: Record<string, any>) => {
        return (slotFn && slotFn(data, currentKey, capturedScope)) || null
      }
      return allSlots
    }, {} as RenderableSlots)
  }

  function createElement(
    lib: FormKitComponentLibrary,
    node: FormKitSchemaNode
  ): RenderNodes {
    const [condition, element, attrs, children, alternate, iterator, resolve] =
      parseNode(lib, node)

    let createNodes: RenderNodes = ((iterationData?: Record<string, unknown>) => {
      if (condition && element === null && children) {
        return condition()
          ? children(iterationData)
          : alternate && alternate(iterationData)
      }

      if (element && (!condition || condition())) {
        if (element === 'text') {
          return children ? String(children(iterationData)) : ''
        }

        if (element === 'slot' && children) {
          return children(iterationData)
        }

        const resolvedEl =
          resolve && typeof element === 'string'
            ? (lib[element] || (globalThis as any)[element])
            : element

        if (!resolvedEl) {
          return null
        }

        let normalizedAttrs = normalizeAttrs(
          resolvedEl as string | ComponentType<any> | null,
          attrs()
        )
        const slots: RenderableSlots | null = children?.slot
          ? createSlots(children, iterationData)
          : null

        if (slots) {
          return h(
            resolvedEl as ComponentType<any>,
            {
              ...(normalizedAttrs || {}),
              slots,
            },
            slots.default ? slots.default() : null
          )
        }

        let renderedChildren =
          normalizedAttrs &&
          typeof normalizedAttrs === 'object' &&
          'dangerouslySetInnerHTML' in normalizedAttrs
            ? null
            : ((children ? children(iterationData) : null) as ReactNode)

        if (typeof resolvedEl === 'string' && resolvedEl === 'select') {
          const selectedValues: unknown[] = []
          renderedChildren = normalizeSelectOptions(
            renderedChildren,
            selectedValues
          )
          if (
            normalizedAttrs &&
            typeof normalizedAttrs === 'object' &&
            normalizedAttrs.value === undefined &&
            normalizedAttrs.defaultValue === undefined &&
            selectedValues.length
          ) {
            normalizedAttrs = {
              ...normalizedAttrs,
              value:
                normalizedAttrs.multiple === true
                  ? selectedValues
                  : selectedValues[0],
            }
          } else if (
            normalizedAttrs &&
            typeof normalizedAttrs === 'object' &&
            normalizedAttrs.multiple === true &&
            normalizedAttrs.value === undefined &&
            normalizedAttrs.defaultValue === undefined
          ) {
            normalizedAttrs = {
              ...normalizedAttrs,
              value: [],
            }
          }
        } else if (typeof resolvedEl === 'string' && resolvedEl === 'textarea') {
          renderedChildren = null
        }

        if (
          typeof resolvedEl === 'string' &&
          (resolvedEl === 'input' || resolvedEl === 'textarea') &&
          normalizedAttrs &&
          typeof normalizedAttrs === 'object' &&
          isDomValueManagedControl(resolvedEl, normalizedAttrs)
        ) {
          return h(DomValueHost, {
            attrs: normalizedAttrs,
            key: normalizedAttrs.key,
            element: resolvedEl,
            children: renderedChildren,
          })
        }

        return h(
          resolvedEl as ComponentType<any>,
          normalizedAttrs || undefined,
          renderedChildren
        )
      }

      return typeof alternate === 'function'
        ? alternate(iterationData)
        : alternate
    }) as RenderNodes

    if (iterator) {
      const repeatedNode = createNodes
      const [getValues, valueName, keyName] = iterator

      createNodes = (() => {
        const _v = getValues()
        const values = Number.isFinite(_v)
          ? Array(Number(_v))
              .fill(0)
              .map((_, i) => i)
          : _v

        const fragment = []
        if (typeof values !== 'object') return null
        const scope = instanceScopes.get(instanceKey) || []
        const isArray = Array.isArray(values)

        for (const key in values) {
          if (isArray && key in Array.prototype) continue

          const iterationData: Record<string, unknown> = Object.defineProperty(
            {
              ...scope.reduce(
                (
                  previousIterationData: Record<string, undefined>,
                  scopedData: Record<string, undefined>
                ) => {
                  if (previousIterationData.__idata) {
                    return { ...previousIterationData, ...scopedData }
                  }
                  return scopedData
                },
                {} as Record<string, undefined>
              ),
              [valueName]: (values as Record<string, any>)[key],
              ...(keyName !== null
                ? { [keyName]: isArray ? Number(key) : key }
                : {}),
            },
            '__idata',
            { enumerable: false, value: true }
          )

          scope.unshift(iterationData)
          const renderedNode = repeatedNode.bind(null, iterationData)() as ReactNode
          fragment.push(
            h(
              Fragment,
              {
                key: resolveIterationKey(
                  renderedNode,
                  isArray ? Number(key) : key
                ),
              },
              renderedNode
            )
          )
          scope.shift()
        }

        return fragment
      }) as RenderNodes
    }

    return createNodes
  }

  function createElements(
    lib: FormKitComponentLibrary,
    schemaNodes: FormKitSchemaNode | FormKitSchemaNode[]
  ): RenderChildren {
    if (Array.isArray(schemaNodes)) {
      const els = schemaNodes.map(createElement.bind(null, lib))
      return (iterationData?: Record<string, unknown>) =>
        els.map((element, index) =>
          h(
            Fragment,
            { key: index },
            element(iterationData) as ReactNode
          )
        )
    }

    const element = createElement(lib, schemaNodes)
    return (iterationData?: Record<string, unknown>) => element(iterationData)
  }

  const providers: ProviderRegistry = []

  function provider(
    compiled: FormKitCompilerOutput,
    hints: Record<string, boolean> = {}
  ) {
    const compiledFns = new WeakMap<object, FormKitCompilerOutput>()

    providers.push((callback: SchemaProviderCallback, key: object) => {
      compiledFns.set(key, compiled.provide((tokens) => callback(tokens, hints)))
    })

    return () => {
      const fn = compiledFns.get(instanceKey)
      return fn ? fn() : undefined
    }
  }

  function createInstance(
    providerCallback: SchemaProviderCallback,
    key: object
  ): RenderChildren {
    memoKey ??= toMemoKey(schema)

    const [render, compiledProviders] = has(memo, memoKey)
      ? memo[memoKey]
      : [createElements(library, schema), providers]

    memoKeys[memoKey] ??= 0
    memoKeys[memoKey]++
    memo[memoKey] = [render, compiledProviders]

    compiledProviders.forEach((compiledProvider) => {
      compiledProvider(providerCallback, key)
    })

    return () => {
      instanceKey = key
      return render()
    }
  }

  return createInstance
}

function useScope(token: string, defaultValue: any) {
  const scopedData = instanceScopes.get(instanceKey) || []
  let scopedValue: any = undefined
  if (scopedData.length) {
    scopedValue = getValue(scopedData, token.split('.'))
  }
  return scopedValue === undefined ? defaultValue : scopedValue
}

function slotData(data: Record<string, any>, key: object) {
  return new Proxy(data, {
    get(...args) {
      let scoped: any = undefined
      const property = args[1]
      if (typeof property === 'string') {
        const prevKey = instanceKey
        instanceKey = key
        scoped = useScope(property, undefined)
        instanceKey = prevKey
      }
      return scoped !== undefined ? scoped : Reflect.get(...args)
    },
  })
}

function createRenderFn(
  instanceCreator: SchemaProvider,
  data: Record<string, any>,
  key: object
) {
  return instanceCreator(
    (requirements, hints: Record<string, boolean> = {}) => {
      return requirements.reduce((tokens, token) => {
        if (token.startsWith('slots.')) {
          const slot = token.substring(6)
          const hasSlot = () =>
            data.slots &&
            has(data.slots, slot) &&
            typeof data.slots[slot] === 'function'

          if (hints.if) {
            tokens[token] = hasSlot
          } else if (data.slots) {
            const scopedData = slotData(data, key)
            tokens[token] = () =>
              hasSlot() ? data.slots[slot](scopedData) : null
          }
        } else if (token === 'get') {
          tokens[token] = () => useScope(token, get)
        } else {
          const path = token.split('.')
          tokens[token] = () => useScope(token, getValue(data, path))
        }
        return tokens
      }, {} as Record<string, any>)
    },
    key
  )
}

function clean(
  schema: FormKitSchemaDefinition,
  memoKey: string | undefined,
  key: object
) {
  memoKey ??= toMemoKey(schema)
  if (!(memoKey in memoKeys)) {
    instanceScopes.delete(key)
    return
  }

  memoKeys[memoKey]--

  if (memoKeys[memoKey] <= 0) {
    delete memoKeys[memoKey]
    const memoized = memo[memoKey]
    if (memoized) {
      const [, providers] = memoized
      delete memo[memoKey]
      providers.length = 0
    }
  }

  instanceScopes.delete(key)
}

function toMemoKey(schema: FormKitSchemaDefinition) {
  return JSON.stringify(schema, (_, value) => {
    if (typeof value === 'function') {
      return value.toString()
    }
    return value
  })
}

export interface FormKitSchemaProps {
  schema: FormKitSchemaDefinition
  data?: Record<string, any>
  library?: FormKitComponentLibrary
  memoKey?: string
  onMounted?: () => void
  slots?: Record<string, (...args: any[]) => ReactNode>
}

export function FormKitSchema(props: FormKitSchemaProps) {
  const instanceKeyRef = useRef<object>({})
  const previousSchema = useRef<FormKitSchemaDefinition>(props.schema)
  const previousMemoKey = useRef<string | undefined>(props.memoKey)

  if (!instanceScopes.has(instanceKeyRef.current)) {
    instanceScopes.set(instanceKeyRef.current, [])
  }

  useReactiveStore(props.data)

  const library = useMemo(
    () => ({ FormKit, ...(props.library || {}) }),
    [props.library]
  )

  if (
    previousSchema.current !== props.schema ||
    previousMemoKey.current !== props.memoKey
  ) {
    const oldKey = instanceKeyRef.current
    instanceKeyRef.current = {}
    instanceScopes.set(instanceKeyRef.current, [])
    clean(previousSchema.current, previousMemoKey.current, oldKey)
    previousSchema.current = props.schema
    previousMemoKey.current = props.memoKey
  }

  const provider = useMemo(
    () => parseSchema(library, props.schema, props.memoKey),
    [library, props.memoKey, props.schema]
  )

  const data = useMemo(() => {
    const base = props.data ?? {}
    const slots = props.slots || {}

    // Use a live proxy over data so lazily initialized context properties
    // (for example `fns`) are available to compiled schema expressions.
    return new Proxy(base, {
      get(target, property, receiver) {
        if (property === 'slots') return slots
        return Reflect.get(target, property, receiver)
      },
      has(target, property) {
        if (property === 'slots') return true
        return Reflect.has(target, property)
      },
    })
  }, [props.data, props.slots])

  const render = useMemo(
    () => createRenderFn(provider, data, instanceKeyRef.current),
    [data, provider]
  )

  useEffect(() => {
    props.onMounted?.()
  }, [props.onMounted])

  useEffect(() => {
    return () => {
      clean(props.schema, props.memoKey, instanceKeyRef.current)
    }
  }, [props.memoKey, props.schema])

  return h(Fragment, null, render ? (render() as ReactNode) : null)
}

export default FormKitSchema
