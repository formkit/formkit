import type {
  FormKitNode,
  FormKitPlugin,
  FormKitTextFragment,
} from '@formkit/core'
import { has } from '@formkit/utils'

/**
 * Note: We are choosing not to implement via Intl.Locale because the support is
 * not yet good enough to be used without polyfill consideration, and that
 * polyfill is 36.3Kb min + gzip — larger than all of FormKit.
 *
 * https://formatjs.io/docs/polyfills/intl-locale/
 *
 * Instead we use a very minimal solution that should provide very good support
 * for all users, and we're happy to expand this package if we see areas where
 * localization is not quite good enough. Also, once support for Intl.Locale
 * becomes better, we would expect this package to switch much of it's
 * underlying locale parsing logic to nose native APIs.
 */

/**
 * A registry of locale messages — this is simply a keyed/value object with
 * string keys (message name) and either string values (for simple returns) or
 * functions that receive a context object.
 *
 * @public
 */
export interface FormKitLocaleMessages {
  [index: string]: string | ((...args: any[]) => string)
}

/**
 * A locale is just a collection of locale message registries, they are keyed
 * by the type (like a namespace) ex: "validation" or "ui". Plugin authors
 * can declare their own types too.
 *
 * @public
 */
export interface FormKitLocale {
  ui: FormKitLocaleMessages
  [index: string]: FormKitLocaleMessages
}

/**
 * The locale registry is just a key-value pair of locale indexes ('ar', 'en',
 * 'it', etc.) to their respective locales.
 *
 * @public
 */
export interface FormKitLocaleRegistry {
  [index: string]: FormKitLocale
}

/**
 * A registry of all i18n nodes.
 */
const i18nNodes = new Set<FormKitNode>()

/**
 * The currently active locale.
 */
let globalActiveLocale: string | null = null

/**
 * Create a new internationalization plugin for FormKit.
 *
 * @param registry - The registry of {@link @formkit/i18n#FormKitLocaleRegistry | FormKitLocales}.
 *
 * @returns {@link @formkit/core#FormKitPlugin | FormKitPlugin}
 *
 * @public
 */
export function createI18nPlugin(
  registry: FormKitLocaleRegistry
): FormKitPlugin {
  return function i18nPlugin(node: FormKitNode) {
    i18nNodes.add(node)
    if (globalActiveLocale) node.config.locale = globalActiveLocale
    if (node.props.__locales__) {
      registry = { ...registry, ...node.props.__locales__ }
    }
    node.on('destroying', () => i18nNodes.delete(node))
    let localeKey = parseLocale(node.config.locale, registry)
    let locale = localeKey ? registry[localeKey] : ({} as FormKitLocale)
    /* If the locale prop changes, update the active locale */
    node.on('prop:locale', ({ payload: lang }) => {
      localeKey = parseLocale(lang, registry)
      locale = localeKey ? registry[localeKey] : ({} as FormKitLocale)
      // Run through all the messages in the store and update with new locale
      node.store.touch()
    })
    node.on('prop:label', () => node.store.touch())
    node.on('prop:validationLabel', () => node.store.touch())

    /**
     * Hook into the core text or t() hook to perform localization on the
     * output of core functionality.
     */
    node.hook.text((fragment: FormKitTextFragment, next) => {
      const key = fragment.meta?.messageKey || fragment.key
      if (has(locale, fragment.type) && has(locale[fragment.type], key)) {
        const t = locale[fragment.type][key]
        if (typeof t === 'function') {
          fragment.value = Array.isArray(fragment.meta?.i18nArgs)
            ? t(...fragment.meta!.i18nArgs) // eslint-disable-line @typescript-eslint/no-non-null-assertion
            : t(fragment)
        } else {
          fragment.value = t
        }
      }
      return next(fragment)
    })
  }
}

/**
 * Parse ISO 639-1 and 639-2 to a valid locale key.
 *
 * @param locale - An ISO 639-1 and (optionally) ISO 639-2 language tag. For these are valid locale keys:
 * zh
 * zh-CN
 * zh-HK
 * en
 * en-GB
 *
 * @param availableLocales - An array of locales that may be valid.
 *
 * @public
 */
function parseLocale(
  locale: string,
  availableLocales: FormKitLocaleRegistry
): string | false {
  if (has(availableLocales, locale)) {
    return locale
  }
  const [lang] = locale.split('-')
  if (has(availableLocales, lang)) {
    return lang
  }
  for (const locale in availableLocales) {
    return locale
  }
  return false
}

/**
 * Change the active locale of all FormKit instances (global).
 * @param locale - The locale to change to
 */
export function changeLocale(locale: string) {
  globalActiveLocale = locale
  for (const node of i18nNodes) {
    node.config.locale = locale
  }
}
