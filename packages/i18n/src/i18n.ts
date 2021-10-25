import { FormKitNode, FormKitPlugin, FormKitTextFragment } from '@formkit/core'
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
 * @public
 */
export interface FormKitLocaleMessages {
  [index: string]: string | ((...args: any[]) => string)
}

/**
 * A locale is just a collection of locale message registries, they are keyed
 * by the type (like a namespace) ex: "validation" or "ui". Plugin authors
 * can declare their own types too.
 * @public
 */
export interface FormKitLocale {
  ui: FormKitLocaleMessages
  [index: string]: FormKitLocaleMessages
}

/**
 * The locale registry is just a key-value pair of locales to their respective
 * registries.
 * @public
 */
export interface FormKitLocaleRegistry {
  [index: string]: FormKitLocale
}

/**
 * Create a new internationalization plugin for FormKit.
 * @param locales - Creates the i18n plugin.
 * @public
 */
export function createI18nPlugin(
  registry: FormKitLocaleRegistry
): FormKitPlugin {
  return function i18nPlugin(node: FormKitNode) {
    let localeKey = parseLocale(node.config.locale, registry)
    let locale = localeKey ? registry[localeKey] : ({} as FormKitLocale)
    /* If the locale changes — change the active locale */
    node.on('config:locale', ({ payload: lang }) => {
      localeKey = parseLocale(lang, registry)
      locale = localeKey ? registry[localeKey] : ({} as FormKitLocale)
    })
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
 * @param locale - An ISO 639-1 and (optionally) ISO 639-2 language tag. For
 * example these are valid locale keys:
 * zh
 * zh-CN
 * zh-HK
 * en
 * en-GB
 * @param availableLocales - An array of locales that may be valid.
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
