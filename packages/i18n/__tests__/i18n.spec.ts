import { createNode, createMessage } from '@formkit/core'
import { locales, createI18nPlugin } from '../src/index'

describe('i18n plugin', () => {
  const i18n = createI18nPlugin(locales)

  it('can intercept and translate a standard validation message', () => {
    const node = createNode({ plugins: [i18n] })
    const message = createMessage({
      type: 'validation',
      key: 'required_rule',
      meta: {
        messageKey: 'required',
        i18nArgs: [{ node, name: 'Foobar' }],
      },
      value: 'Invalid',
    })
    node.store.set(message)
    expect(node.store.required_rule.value).toBe('Foobar is required.')
  })
})
