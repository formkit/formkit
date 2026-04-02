import {
  error,
  createNode,
  FormKitNode,
  FormKitOptions,
  FormKitMessage,
  createMessage,
  FormKitPseudoProps,
  FormKitGroupValue,
} from '@formkit/core'
import { FormKitRuntimeProps, FormKitInputs } from '@formkit/inputs'
import {
  nodeProps,
  camel,
  extend,
  only,
  kebab,
  cloneAny,
  slugify,
  isObject,
  token,
  undefine,
  oncePerTick,
  eq,
  shallowClone,
} from '@formkit/utils'
import {
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import { optionsSymbol } from '../plugin'
import { onSSRComplete } from './onSSRComplete'
import { componentSymbol, parentSymbol, rootSymbol } from '../context'

interface FormKitComponentListeners {
  onSubmit?: (payload?: FormKitGroupValue) => Promise<unknown> | unknown
  onSubmitRaw?: (event?: Event) => unknown
  onSubmitInvalid?: (node?: Node) => unknown
}

function isPlainObject(value: unknown): value is Record<string, any> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.getPrototypeOf(value) === Object.prototype
  )
}

function shallowEqualObjects(
  a: Record<string, any>,
  b: Record<string, any>
): boolean {
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  if (aKeys.length !== bKeys.length) return false
  for (const key of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false
    if (!Object.is(a[key], b[key])) return false
  }
  return true
}

function safeEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!Object.is(a[i], b[i])) return false
    }
    return true
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    return shallowEqualObjects(a, b)
  }

  if (
    typeof a !== 'object' &&
    typeof b !== 'object' &&
    typeof a !== 'function' &&
    typeof b !== 'function'
  ) {
    return eq(a, b)
  }

  return false
}

const pseudoProps = [
  'ignore',
  'disabled',
  'preserve',
  'help',
  'label',
  /^preserve(-e|E)rrors/,
  /^[a-z]+(?:-visibility|Visibility|-behavior|Behavior)$/,
  /^[a-zA-Z-]+(?:-class|Class)$/,
  'prefixIcon',
  'suffixIcon',
  /^[a-zA-Z-]+(?:-icon|Icon)$/,
]

const boolProps = ['disabled', 'ignore', 'preserve']

const runtimeOnlyProps = new Set<string>([
  'children',
  'slots',
  'classes',
  'config',
  'delay',
  'errors',
  'id',
  'index',
  'inputErrors',
  'library',
  'modelValue',
  'name',
  'number',
  'parent',
  'plugins',
  'sectionsSchema',
  'type',
  'validation',
  'validationLabel',
  'validationMessages',
  'validationRules',
  'value',
  'defaultValue',
  'onInput',
  'onInputRaw',
  'onNode',
  'onSubmit',
  'onSubmitInvalid',
  'onSubmitRaw',
  'onUpdate:modelValue',
  'onUpdateModelValue',
])

function classesToNodeProps(node: FormKitNode, props: Record<string, any>) {
  if (props.classes) {
    Object.keys(props.classes).forEach((key: keyof (typeof props)['classes']) => {
      if (typeof key === 'string') {
        node.props[`_${key}Class`] = props.classes[key]
        if (isObject(props.classes[key]) && key === 'inner') {
          Object.values(props.classes[key])
        }
      }
    })
  }
}

function onlyListeners(
  props: Record<string, unknown> | null | undefined
): FormKitComponentListeners {
  if (!props) return {}
  const knownListeners = ['Submit', 'SubmitRaw', 'SubmitInvalid'].reduce(
    (listeners, listener) => {
      const name = `on${listener}`
      if (name in props && typeof props[name] === 'function') {
        listeners[name] = props[name] as CallableFunction
      }
      return listeners
    },
    {} as Record<string, CallableFunction>
  )
  return knownListeners as FormKitComponentListeners
}

function patternMatches(
  key: string,
  patterns: Array<string | RegExp> | Set<string | RegExp>
): boolean {
  for (const pattern of patterns) {
    if (typeof pattern === 'string') {
      if (pattern === key || camel(pattern) === key || kebab(pattern) === key) {
        return true
      }
    } else if (pattern.test(key)) {
      return true
    }
  }
  return false
}

function getModelValue(props: Record<string, any>): unknown {
  if (props.modelValue !== undefined) return props.modelValue
  return props.value
}

export function useInput<Props extends FormKitInputs<Props>>(
  props: Props & Record<string, any>,
  options: FormKitOptions = {}
): FormKitNode {
  const providedOptions = useContext(optionsSymbol)
  const config = Object.assign({}, providedOptions || {}, options)
  const __root = useContext(rootSymbol)
  const __cmpCallback = useContext(componentSymbol)
  const inheritedParent = useContext(parentSymbol)

  const listeners = onlyListeners(props)
  const isVModeled =
    props.modelValue !== undefined ||
    props.value !== undefined ||
    typeof props.onUpdateModelValue === 'function'

  const value: any =
    props.modelValue !== undefined
      ? props.modelValue
      : props.value !== undefined
      ? props.value
      : cloneAny(props.defaultValue)

  const createInitialProps = useMemo(() => {
    const initialProps: Record<string, any> = {
      ...nodeProps(props),
      ...listeners,
      type: props.type ?? 'text',
      __root,
      __slots: props.slots || {},
    }

    const allProps = nodeProps(props)
    const attrs = Object.keys(allProps).reduce((acc, key) => {
      if (
        runtimeOnlyProps.has(key) ||
        patternMatches(key, pseudoProps as Array<string | RegExp>)
      ) {
        return acc
      }
      acc[key] = allProps[key]
      return acc
    }, {} as Record<string, unknown>)

    if (!attrs.key) attrs.key = token()
    initialProps.attrs = attrs

    const propValues = only(allProps, pseudoProps)
    for (const propName in propValues) {
      if (boolProps.includes(propName) && propValues[propName] === '') {
        propValues[propName] = true
      }
      initialProps[camel(propName)] = propValues[propName]
    }

    const classesProps = { props: {} }
    classesToNodeProps(classesProps as FormKitNode, props)
    Object.assign(initialProps, classesProps.props)

    if (typeof initialProps.type !== 'string') {
      initialProps.definition = initialProps.type
      delete initialProps.type
    }
    return initialProps
  }, [listeners, props, __root])

  const parent = createInitialProps.ignore
    ? null
    : props.parent || inheritedParent || null

  const node = useMemo(() => {
    const nodeOptions = extend(
      config || {},
      {
        name: props.name || undefined,
        value,
        parent,
        plugins: (config.plugins || []).concat(props.plugins ?? []),
        config: props.config || {},
        props: createInitialProps,
        index: props.index,
        sync: !!undefine(props.sync || props.dynamic),
      },
      false,
      true
    ) as Partial<FormKitOptions>

    const created = createNode(nodeOptions) as FormKitNode

    __cmpCallback(created)

    if (!created.props.definition) error(600, created)

    onSSRComplete(providedOptions || undefined, () => {
      created.destroy()
    })

    return created
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const lateBoundProps = useRef<Set<string | RegExp>>(
    new Set(
      Array.isArray(node.props.__propDefs)
        ? node.props.__propDefs
        : Object.keys(node.props.__propDefs ?? {})
    )
  )

  useEffect(() => {
    const receipt = node.on(
      'added-props',
      ({ payload: lateProps }: { payload: FormKitPseudoProps }) => {
        const propNames = Array.isArray(lateProps)
          ? lateProps
          : Object.keys(lateProps ?? {})
        propNames.forEach((newProp) => lateBoundProps.current.add(newProp))
      }
    )
    return () => {
      node.off(receipt)
    }
  }, [node])

  const propsRef = useRef(props)
  propsRef.current = props

  const isMountedRef = useRef(false)
  const clonedValueBeforeVModel = useRef<unknown>(undefined)
  const lastErrors = useRef<any>(undefined)
  const lastInputErrors = useRef<any>(undefined)
  const lastConfig = useRef<any>(undefined)
  const syncedAttrKeys = useRef<Set<string>>(new Set())
  const blurWrapperCache = useRef(
    new WeakMap<(...args: any[]) => any, (...args: any[]) => any>()
  )
  const previousPassThrough = useRef<Record<string, any>>({})
  const previousPseudoValues = useRef<Record<string, any>>({})
  const initializedPropSync = useRef(false)
  const pendingDestroy = useRef<object | null>(null)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    classesToNodeProps(node, props)

    const passThrough = nodeProps(props)
    const pseudoPropNames: Array<string | RegExp> = pseudoProps
      .concat([...lateBoundProps.current])
      .reduce((names, prop) => {
        if (typeof prop === 'string') {
          names.push(camel(prop))
          names.push(kebab(prop))
        } else {
          names.push(prop)
        }
        return names
      }, [] as Array<string | RegExp>)

    const allProps = nodeProps(props)
    const propValues = only(allProps, pseudoPropNames)
    const nextPseudoValues: Record<string, any> = {}

    if (initializedPropSync.current) {
      for (const prop in passThrough) {
        const next = props[prop as keyof FormKitRuntimeProps<Props>]
        const previous = previousPassThrough.current[prop]
        if (next !== undefined && !safeEqual(previous, next)) {
          node.props[prop] = next
        }
      }

      for (const prop in propValues) {
        if (!Object.prototype.hasOwnProperty.call(allProps, prop)) continue
        nextPseudoValues[prop] = propValues[prop]
        const camelName = camel(prop)
        if (!safeEqual(previousPseudoValues.current[prop], propValues[prop])) {
          node.props[camelName] = propValues[prop]
        }
      }
    } else {
      for (const prop in propValues) {
        if (!Object.prototype.hasOwnProperty.call(allProps, prop)) continue
        nextPseudoValues[prop] = propValues[prop]
      }
      initializedPropSync.current = true
    }

    previousPassThrough.current = passThrough
    previousPseudoValues.current = nextPseudoValues

    if (!safeEqual(node.props.__root, __root)) {
      node.props.__root = __root
    }
    if (!safeEqual(node.props.__slots, props.slots || {})) {
      node.props.__slots = props.slots || {}
    }

    const attrs = Object.keys(allProps).reduce((acc, key) => {
      if (
        runtimeOnlyProps.has(key) ||
        patternMatches(key, pseudoPropNames) ||
        key === 'multiple'
      ) {
        return acc
      }
      acc[key] = allProps[key]
      return acc
    }, {} as Record<string, any>)

    if ('multiple' in allProps) {
      attrs.multiple = undefine(allProps.multiple)
    }

    if (typeof attrs.onBlur === 'function') {
      const rawBlur = attrs.onBlur as (...args: any[]) => any
      let wrappedBlur = blurWrapperCache.current.get(rawBlur)
      if (!wrappedBlur) {
        wrappedBlur = oncePerTick(rawBlur)
        blurWrapperCache.current.set(rawBlur, wrappedBlur)
      }
      attrs.onBlur = wrappedBlur
    }

    const mergedAttrs = Object.assign({}, node.props.attrs || {})
    for (const oldKey of syncedAttrKeys.current) {
      if (!(oldKey in attrs)) {
        delete mergedAttrs[oldKey]
      }
    }
    Object.assign(mergedAttrs, attrs)
    syncedAttrKeys.current = new Set(Object.keys(attrs))
    if (!safeEqual(node.props.attrs, mergedAttrs)) {
      node.props.attrs = mergedAttrs
    }

    if (!safeEqual(lastErrors.current, props.errors)) {
      lastErrors.current = cloneAny(props.errors)
      const messages = (props.errors ?? []).map((err) =>
        createMessage({
          key: slugify(err),
          type: 'error',
          value: err,
          meta: { source: 'prop' },
        })
      )

      node.store.apply(
        messages,
        (message) => message.type === 'error' && message.meta.source === 'prop'
      )
    }

    if (node.type !== 'input') {
      if (!safeEqual(lastInputErrors.current, props.inputErrors)) {
        lastInputErrors.current = cloneAny(props.inputErrors)
        const sourceKey = `${node.name}-prop`
        const inputErrors = props.inputErrors ?? {}
        const keys = Object.keys(inputErrors)
        if (!keys.length) node.clearErrors(true, sourceKey)
        const errorMessages = keys.reduce((msgs, key) => {
          let value = inputErrors[key]
          if (typeof value === 'string') value = [value]
          if (Array.isArray(value)) {
            msgs[key] = value.map((err) =>
              createMessage({
                key: err,
                type: 'error',
                value: err,
                meta: { source: sourceKey },
              })
            )
          }
          return msgs
        }, {} as Record<string, FormKitMessage[]>)
        node.store.apply(
          errorMessages,
          (message) =>
            message.type === 'error' && message.meta.source === sourceKey
        )
      }
    }

    if (!safeEqual(lastConfig.current, props.config)) {
      lastConfig.current = cloneAny(props.config)
      Object.assign(node.config, props.config)
    }
  })

  useEffect(() => {
    const receipt = node.on('modelUpdated', () => {
      const currentProps = propsRef.current

      currentProps.onInputRaw?.(node.context?.value, node)
      if (isMountedRef.current) {
        currentProps.onInput?.(node.context?.value, node)
      }

      if (isVModeled && node.context) {
        clonedValueBeforeVModel.current = cloneAny(node.value)
        const updated = shallowClone(node.value)
        currentProps.onUpdateModelValue?.(updated)
        const modelUpdate = currentProps[
          'onUpdate:modelValue'
        ] as ((value: unknown) => void) | undefined
        if (typeof modelUpdate === 'function') {
          modelUpdate(updated)
        }
        if (typeof currentProps.onChange === 'function') {
          currentProps.onChange(updated, node)
        }
      }
    })

    if (isVModeled && !eq(node.value, value)) {
      queueMicrotask(() => {
        node.emit('modelUpdated')
      })
    }

    return () => {
      node.off(receipt)
    }
  }, [isVModeled, node, value])

  const modeledValue = getModelValue(props)

  useEffect(() => {
    if (!isVModeled) return
    if (!eq(clonedValueBeforeVModel.current, modeledValue)) {
      node.input(modeledValue, false)
    }
  }, [isVModeled, modeledValue, node])

  useEffect(() => {
    pendingDestroy.current = null
    return () => {
      // React StrictMode runs effect cleanup/setup during development. Defer
      // teardown so a same-tick remount can cancel this destroy.
      const destroyToken = {}
      pendingDestroy.current = destroyToken
      queueMicrotask(() => {
        if (pendingDestroy.current === destroyToken) {
          pendingDestroy.current = null
          node.destroy()
        }
      })
    }
  }, [node])

  return node
}
