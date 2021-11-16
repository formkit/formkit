import { createMessage, FormKitNode } from '@formkit/core'
import { has, clone } from '@formkit/utils'

/**
 * Handle the submit event.
 * @param e - The event
 */
async function handleSubmit(node: FormKitNode, e: Event) {
  e.preventDefault()
  await node.settled
  if (!node.ledger.value('blocking')) {
    if (typeof node.props.attrs?.onSubmit === 'function') {
      // call onSubmit
      node.props.attrs.onSubmit(clone(node.value as Record<string, any>))
    }
  } else {
    node.store.set(
      createMessage({
        blocking: false,
        key: `incomplete`,
        meta: {
          /**
           * Determines if this message should be passed to localization.
           */
          localize: true,
          /**
           * The arguments that will be passed to the validation rules
           */
          i18nArgs: [{ node }],
        },
        type: 'ui',
        value: 'Form incomplete.',
      })
    )
    node.on('settled:blocking', () => node.store.remove('incomplete'))
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
}
