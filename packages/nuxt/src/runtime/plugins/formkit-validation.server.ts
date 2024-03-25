import { defineNuxtPlugin, useRequestEvent } from '#imports'
import type { FormKitNode } from '@formkit/core'
import { stopWatch, watchRegistry } from '@formkit/core'
import { getValidationMessages } from '@formkit/validation'

export default defineNuxtPlugin(nuxtApp => {
  const event = useRequestEvent()
  const context = event?.context?.formkit

  if (context && context._id) {
    let node: FormKitNode

    // This will be called when the node is initialised and just before it is destroyed
    const unsub = watchRegistry(context._id, (event) => {
      if (!event.payload) {
        context._validated = node.ledger.value('blocking') === 0
        if (!context._validated) {
          context._validationMessages = {}
          for (const [child, messages] of getValidationMessages(node)) {
            const address = child.address.join('.')
            context._validationMessages[address] ||= []
            context._validationMessages[address].push(...messages.map(m => m.value))
          }
        }
        return
      }

      node = event.payload
      node.input(context._data, false)
    })

    // Clean up watcher
    nuxtApp.hook('app:error', () => { unsub && stopWatch(unsub) })
    nuxtApp.hook('app:rendered', () => { unsub && stopWatch(unsub) })
  }
})
