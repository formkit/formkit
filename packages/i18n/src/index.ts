import * as de from './locales/de'
import * as en from './locales/en'
import * as fr from './locales/fr'
import * as he from './locales/he'
import * as hr from './locales/hr'
import * as nl from './locales/nl'
import * as pt from './locales/pt'
import * as ru from './locales/ru'
import * as zh from './locales/zh'

/**
 * Export all of the plugin logic
 */
export * from './i18n'

/**
 * Export all the available locales at once.
 * @public
 */
export const locales = {
  de,
  en,
  fr,
  he,
  hr,
  nl,
  pt,
  ru,
  zh,
}

/**
 * Export each locale individually for people who want to cherry pick.
 */
export { de, en, fr, he, hr, nl, pt, ru, zh }

/**
 * Export all formatter functions.
 */
export * from './formatters'
