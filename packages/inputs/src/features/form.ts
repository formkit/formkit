import { createMessage, FormKitNode } from '@formkit/core'
import { has, clone } from '@formkit/utils'

/**
 * Handle the submit event.
 * @param e - The event
 */
async function handleSubmit(node: FormKitNode, e: Event) {
  e.preventDefault()
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

  if (typeof node.props.attrs?.onSubmitRaw === 'function') {
    node.props.attrs.onSubmitRaw(e)
  }

  if (!node.ledger.value('blocking')) {
    // No blocking messages
    if (typeof node.props.attrs?.onSubmit === 'function') {
      // call onSubmit
      const retVal = node.props.attrs.onSubmit(
        clone(node.value as Record<string, any>)
      )
      if (retVal instanceof Promise) {
        node.store.set(
          createMessage({
            key: 'loading',
            value: true,
            visible: false,
          })
        )
        await retVal
        node.store.remove('loading')
      }
    } else {
      if (e.target instanceof HTMLFormElement) {
        e.target.submit()
      }
    }
  } else {
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
  }
}

/**
 * Converts the options prop to usable values.
 * @param node - A formkit node.
 */
export default function (node: FormKitNode): void {
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
