import { parentSymbol } from '../FormKit'
import {
  createNode,
  FormKitNode,
  FormKitMessage,
  FormKitProps,
  warn,
  createMessage,
} from '@formkit/core'
import { nodeProps, except, camel } from '@formkit/utils'
import { FormKitTypeDefinition } from '@formkit/inputs'
import {
  reactive,
  inject,
  provide,
  watchEffect,
  watch,
  toRef,
  SetupContext,
} from 'vue'
import { configSymbol } from '../plugin'
import { minConfig } from '../plugin'

interface FormKitComponentProps {
  type?: string
  name?: string
  modelValue?: any
  errors: string[]
}

/**
 * Props that are extracted from the attrs object.
 * TODO: Currently local, this should probably exported to a inputs or another
 * package.
 */
const universalProps = ['help', 'label', 'options']

/**
 * A composable for creating a new FormKit node.
 * @param type - The type of node (input, group, list)
 * @param attrs - The FormKit "props" — which is really the attrs list.
 * @returns
 * @public
 */
export function useInput(
  input: FormKitTypeDefinition,
  props: FormKitComponentProps,
  context: SetupContext<any>
): [Record<string, any>, FormKitNode<any>] {
  const type = input.type

  /**
   * The configuration options, these are provided by either the plugin or by
   * explicit props.
   */
  const config = inject(configSymbol, minConfig)

  /**
   * The parent node.
   */
  const parent = inject(parentSymbol, null)

  /**
   * Define the initial component
   */
  let value: any =
    props.modelValue !== undefined ? props.modelValue : context.attrs.value
  if (value === undefined) {
    if (type === 'input') value = ''
    if (type === 'group') value = {}
    if (type === 'list') value = []
  }

  const p = nodeProps(context.attrs, props)
  const initialProps: Partial<FormKitProps> = {}
  for (const propName in p) {
    initialProps[camel(propName)] = p[propName]
  }

  /**
   * Create the FormKitNode.
   */
  const node = createNode({
    ...config.nodeOptions,
    type,
    name: props.name || undefined,
    value,
    parent,
    props: initialProps,
  }) as FormKitNode<any>

  /**
   * Add any/all "prop" errors to the store.
   */
  watchEffect(() => {
    // Remove any that are not in the set
    node.store.filter(
      (message) => props.errors.includes(message.value as string),
      'error'
    )
    props.errors.forEach((error) => {
      node.store.set({
        key: error,
        type: 'error',
        value: error,
        visible: true,
        blocking: false,
        meta: {},
      })
    })
  })

  /**
   * This is the reactive data object that is provided to all schemas and
   * forms. It is a subset of data in the core node object.
   */
  const data = reactive({
    _value: node.value,
    attrs: except(
      context.attrs,
      new Set(universalProps.concat(input.props || []))
    ),
    fns: {
      length: (obj: Record<PropertyKey, any>) => Object.keys(obj).length,
      number: (value: any) => Number(value),
      string: (value: any) => String(value),
      json: (value: any) => JSON.stringify(value),
    },
    handlers: {
      blur: () =>
        node.store.set(
          createMessage({ key: 'blurred', visible: false, value: true })
        ),
      dirty: () => {
        node.store.set(
          createMessage({ key: 'dirty', visible: false, value: true })
        )
      },
      DOMInput: (e: Event) => node.input((e.target as HTMLInputElement).value),
    },
    help: toRef(context.attrs, 'help'),
    label: toRef(context.attrs, 'label'),
    messages: node.store.reduce((store, message) => {
      if (message.visible) {
        store[message.key] = message
      }
      return store
    }, {} as Record<string, FormKitMessage>),
    node,
    options: toRef(context.attrs, 'options'),
    state: {} as Record<string, boolean>,
    type: toRef(props, 'type'),
    value: node.value,
  })

  /**
   * Watch and dynamically set prop values so both core and vue states are
   * reactive.
   */
  watchEffect(() => {
    const p = nodeProps(context.attrs, props)
    for (const propName in p) {
      node.props[camel(propName)] = p[propName]
    }
  })

  /**
   * Watch for input events from core.
   */
  node.on('input', ({ payload }) => {
    data._value = payload
  })

  /**
   * Watch for input commits from core.
   */
  node.on('commit', ({ payload }) => {
    switch (type) {
      case 'group':
        data.value = { ...payload }
        break
      case 'list':
        data.value = [...payload]
        break
      default:
        data.value = payload
    }
    // The input is dirty after a value has been input by a user
    if (!data.state.dirty) data.handlers.dirty()
    // Emit the values after commit
    context.emit('input', data.value)
    context.emit('update:modelValue', data.value)
  })

  /**
   * Listen to message events and modify the local message data values.
   */
  node.on('message-added', ({ payload: message }) => {
    if (message.visible) data.messages[message.key] = message
    if (message.type === 'state') {
      data.state[message.key] = message.value
    }
  })
  node.on('message-removed', ({ payload: message }) => {
    delete data.messages[message.key]
    delete data.state[message.key]
  })
  node.on('message-updated', ({ payload: message }) => {
    if (message.visible) data.messages[message.key] = message
    if (message.type === 'state') data.state[message.key] = message.value
  })

  if (node.type !== 'input') {
    provide(parentSymbol, node)
  }

  /**
   * Enabled support for v-model, this is not really recommended.
   */
  if (props.modelValue !== undefined) {
    watch(
      () => props.modelValue,
      (value) => {
        if (node.type !== 'input') warn(678)
        node.input(value, false)
      },
      {
        deep: true,
      }
    )
  }

  return [data, node]
}
