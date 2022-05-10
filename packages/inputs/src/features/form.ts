import { createMessage, FormKitNode } from '@formkit/core'
import { has, clone } from '@formkit/utils'

/**
 * Handle the submit event.
 * @param e - The event
 */
async function handleSubmit(node: FormKitNode, submitEvent: Event) {
  submitEvent.preventDefault()
  await node.settled
  // Set the submitted state on all children
  node.walk((n) => {
    n.store.set(
      createMessage({
        key: 'submitted',
        value: true,
        visible: false,
      })
    )
  })

  if (typeof node.props.onSubmitRaw === 'function') {
    node.props.onSubmitRaw(submitEvent, node)
  }

  if (node.ledger.value('blocking')) {
    // There is still a blocking message in the store.
    if (node.props.incompleteMessage !== false) {
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
  } else {
    // No blocking messages
    if (typeof node.props.onSubmit === 'function') {
      // call onSubmit
      const retVal = node.props.onSubmit(
        clone(node.value as Record<string, any>),
        node
      )
      if (retVal instanceof Promise) {
        const autoDisable =
          node.props.disabled === undefined &&
          node.props.submitBehavior !== 'live'
        if (autoDisable) node.props.disabled = true
        node.store.set(
          createMessage({
            key: 'loading',
            value: true,
            visible: false,
          })
        )
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
 * Converts the options prop to usable values.
 * @param node - A formkit node.
 * @public
 */
export default function form(node: FormKitNode): void {
  node.props.isForm = true
  node.on('created', () => {
    if (node.context?.handlers) {
      node.context.handlers.submit = handleSubmit.bind(null, node)
    }
    if (!has(node.props, 'actions')) {
      node.props.actions = true
    }
  })
  node.on('settled:blocking', () => node.store.remove('incomplete'))
}
