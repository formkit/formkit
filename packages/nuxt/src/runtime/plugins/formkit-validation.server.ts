import { defineNuxtPlugin, useRequestEvent } from '#imports'
import type { FormKitNode } from '@formkit/core'
import { stopWatch, watchRegistry } from '@formkit/core'
import { getValidationMessages } from '@formkit/validation'

export default defineNuxtPlugin(nuxtApp => {
  const context = useRequestEvent()?.context?.formkit
  if (!context || !context._id) return

  let node: FormKitNode

  // This will be called when the node is initialised
  const unsub = watchRegistry(context._id, (event) => {
    if (event.payload) {
      node = event.payload
      node.input(context._data)
    }
  })

  async function setValidationState () {
    if (!context) return

    await node.ledger.settled('validating')
    context._validated = node.ledger.value('blocking') === 0
    if (!context._validated) {
      context._validationMessages = {}
      for (const [child, messages] of getValidationMessages(node)) {
        const address = child.address.join('.')
        context._validationMessages[address] ||= []
        context._validationMessages[address].push(...messages.map(m => m.value))
      }
    }

    // Clean up watcher
    if (unsub) stopWatch(unsub)
  }

  // Clean up watcher
  nuxtApp.hook('app:error', setValidationState)
  nuxtApp.hook('app:rendered', setValidationState)
})
