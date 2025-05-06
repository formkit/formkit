import { createMessage, FormKitNode } from '@formkit/core'
import { has, clone } from '@formkit/utils'

const loading = createMessage({
  key: 'loading',
  value: true,
  visible: false,
})

/**
 * Handle the submit event.
 *
 * @param e - The event
 *
 * @internal
 */
async function handleSubmit(node: FormKitNode, submitEvent: Event) {
  const submitNonce = Math.random()
  node.props._submitNonce = submitNonce
  submitEvent.preventDefault()
  await node.settled

  if (node.ledger.value('validating')) {
    // There are validation rules still pending.
    node.store.set(loading)
    await node.ledger.settled('validating')
    node.store.remove('loading')
    // If this was not the same submit event, bail out.
    if (node.props._submitNonce !== submitNonce) return
  }
  // Set the submitted state on all children
  const setSubmitted = (n: FormKitNode) =>
    n.store.set(
      createMessage({
        key: 'submitted',
        value: true,
        visible: false,
      })
    )
  node.walk(setSubmitted)
  setSubmitted(node)

  node.emit('submit-raw')
  if (typeof node.props.onSubmitRaw === 'function') {
    node.props.onSubmitRaw(submitEvent, node)
  }

  if (node.ledger.value('blocking')) {
    if (typeof node.props.onSubmitInvalid === 'function') {
      node.props.onSubmitInvalid(node)
    }
    // There is still a blocking message in the store.
    if (node.props.incompleteMessage !== false) {
      setIncompleteMessage(node)
    }
  } else {
    // No blocking messages
    if (typeof node.props.onSubmit === 'function') {
      // call onSubmit
      const retVal = node.props.onSubmit(
        node.hook.submit.dispatch(clone(node.value as Record<string, any>)),
        node
      )
      if (retVal instanceof Promise) {
        const autoDisable =
          node.props.disabled === undefined &&
          node.props.submitBehavior !== 'live'
        if (autoDisable) node.props.disabled = true
        node.store.set(loading)
        await retVal
        if (autoDisable) node.props.disabled = false
        node.store.remove('loading')
      }
    } else {
      if (submitEvent.target instanceof HTMLFormElement) {
        submitEvent.target.submit()
      }
    }
  }
}

/**
 * Set the incomplete message on a specific node.
 * @param node - The node to set the incomplete message on.
 */
function setIncompleteMessage(node: FormKitNode) {
  node.store.set(
    createMessage({
      blocking: false,
      key: `incomplete`,
      meta: {
        localize: node.props.incompleteMessage === undefined,
        i18nArgs: [{ node }],
        showAsMessage: true,
      },
      type: 'ui',
      value: node.props.incompleteMessage || 'Form incomplete.',
    })
  )
}

/**
 * A feature to add a submit handler and actions section.
 *
 * @param node - A {@link @formkit/core#FormKitNode | FormKitNode}.
 *
 * @public
 */
export default function form(node: FormKitNode): void {
  node.props.isForm = true
  node.ledger.count('validating', (m) => m.key === 'validating')

  node.props.submitAttrs ??= {
    disabled: node.props.disabled,
  }

  node.on('prop:disabled', ({ payload: disabled }) => {
    node.props.submitAttrs = { ...node.props.submitAttrs, disabled }
  })

  node.on('created', () => {
    if (node.context?.handlers) {
      node.context.handlers.submit = handleSubmit.bind(null, node)
    }
    if (!has(node.props, 'actions')) {
      node.props.actions = true
    }
  })
  node.on('prop:incompleteMessage', () => {
    if (node.store.incomplete) setIncompleteMessage(node)
  })
  node.on('settled:blocking', () => node.store.remove('incomplete'))
}
