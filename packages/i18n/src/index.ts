import * as de from './locales/de'
import * as en from './locales/en'
import * as es from './locales/es'
import * as fa from './locales/fa'
import * as fi from './locales/fi'
import * as fr from './locales/fr'
import * as he from './locales/he'
import * as hr from './locales/hr'
import * as ko from './locales/ko'
import * as id from './locales/id'
import * as it from './locales/it'
import * as nl from './locales/nl'
import * as pl from './locales/pl'
import * as pt from './locales/pt'
import * as ru from './locales/ru'
import * as tr from './locales/tr'
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
  es,
  fa,
  fi,
  fr,
  he,
  hr,
  id,
  it,
  ko,
  nl,
  pl,
  pt,
  ru,
  tr,
  zh,
}

/**
 * Export each locale individually for people who want to cherry pick.
 */

export { de, en, es, fa, fi, fr, he, hr, id, it, ko, nl, pl, pt, ru, tr, zh }

/**
 * Export all formatter functions.
 */
export * from './formatters'
