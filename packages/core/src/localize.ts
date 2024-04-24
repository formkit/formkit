import type { FormKitNode } from './node'
import { createMessage } from './index'

/**
 * Creates a new feature that generates a localization message of type ui
 * for use on a given component.
 *
 * @param key - The key of the message.
 * @param value - The value of the message.
 *
 * @returns A {@link @formkit/core#FormKitPlugin | FormKitPlugin}.
 *
 * @public
 */
export function localize(
  key: string,
  value?: string
): (node: FormKitNode) => void {
  return (node: FormKitNode): void => {
    node.store.set(
      createMessage({
        key,
        type: 'ui',
        value: value || key,
        meta: {
          localize: true,
          i18nArgs: [node],
        },
      })
    )
  }
}
