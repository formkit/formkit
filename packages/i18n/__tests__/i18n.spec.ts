import { createNode, createMessage } from '@formkit/core'
import { locales, createI18nPlugin, date } from '../src/index'
import { describe, expect, it, vi } from 'vitest'

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

  it('can change translation when the locale changes', () => {
    const i18n = createI18nPlugin({
      en: { ui: { remove: 'Delete' } },
      it: { ui: { remove: 'Rimuovere' } },
    })
    const node = createNode({ plugins: [i18n] })
    let value = node.t('remove')
    expect(value).toBe('Delete')
    node.config.locale = 'it'
    value = node.t('remove')
    expect(value).toBe('Rimuovere')
  })

  const start = date(new Date('2030-03-15T12:00:00Z'))
  const end = date('2030-04-15')
  it.each([
    { locale: 'en', expected: `Date must be between ${start} and ${end}` },
    { locale: 'hu', expected: `Date mezőnek ${start} és ${end} között kell lennie` },
  ])(
    'shows today as the start of date_between when only one date is given ($locale)',
    ({ locale, expected }) => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2030-03-15T12:00:00Z'))
      const node = createNode({
        plugins: [createI18nPlugin(locales)],
        config: { locale },
      })
      const message = createMessage({
        type: 'validation',
        key: 'date_between_rule',
        meta: {
          messageKey: 'date_between',
          i18nArgs: [{ node, name: 'Date', args: ['2030-04-15'] }],
        },
        value: 'Invalid',
      })
      node.store.set(message)
      const value = node.store.date_between_rule.value as string
      vi.useRealTimers()
      expect(value).toBe(expected)
    }
  )

  it.each([
    { args: [], boundary: '(unknown)' },
    { args: ['1970-01-01'], boundary: date('1970-01-01') },
  ])(
    'keeps the missing boundary when the rule has no implicit limit ($boundary)',
    ({ args, boundary }) => {
      const node = createNode({ plugins: [createI18nPlugin(locales)] })
      const message = createMessage({
        type: 'validation',
        key: 'date_between_rule',
        meta: {
          messageKey: 'date_between',
          i18nArgs: [{ node, name: 'Date', args }],
        },
        value: 'Invalid',
      })
      node.store.set(message)
      expect(node.store.date_between_rule.value).toBe(
        `Date must be between ${boundary} and (unknown)`
      )
    }
  )
})
