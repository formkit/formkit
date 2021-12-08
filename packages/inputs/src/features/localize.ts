import { FormKitNode, createMessage } from '@formkit/core'

/**
 * Creates a localization message (type: ui).
 * @param key - The key of the message
 * @param value - The value of the message
 * @returns
 */
export default function localize(
  key: string,
  value?: string
): (node: FormKitNode) => void {
  return (node: FormKitNode): void => {
    console.log('localize')
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
