import * as ar from './locales/ar'
import * as az from './locales/az'
import * as bg from './locales/bg'
import * as cs from './locales/cs'
import * as da from './locales/da'
import * as de from './locales/de'
import * as en from './locales/en'
import * as es from './locales/es'
import * as fa from './locales/fa'
import * as fi from './locales/fi'
import * as fr from './locales/fr'
import * as fy from './locales/fy'
import * as he from './locales/he'
import * as hr from './locales/hr'
import * as hu from './locales/hu'
import * as id from './locales/id'
import * as it from './locales/it'
import * as ja from './locales/ja'
import * as kk from './locales/kk'
import * as ko from './locales/ko'
import * as nl from './locales/nl'
import * as pl from './locales/pl'
import * as pt from './locales/pt'
import * as ro from './locales/ro'
import * as ru from './locales/ru'
import * as sl from './locales/sl'
import * as sr from './locales/sr'
import * as sv from './locales/sv'
import * as tg from './locales/tg'
import * as th from './locales/th'
import * as tr from './locales/tr'
import * as vi from './locales/vi'
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
  ar,
  az,
  bg,
  cs,
  da,
  de,
  en,
  es,
  fa,
  fi,
  fr,
  fy,
  he,
  hr,
  hu,
  id,
  it,
  ja,
  kk,
  ko,
  nl,
  pl,
  pt,
  ro,
  ru,
  sl,
  sr,
  sv,
  tg,
  th,
  tr,
  vi,
  zh,
}

/**
 * Export each locale individually for people who want to cherry pick.
 */

export {
  ar,
  az,
  bg,
  cs,
  da,
  de,
  en,
  es,
  fa,
  fi,
  fr,
  fy,
  he,
  hr,
  hu,
  id,
  it,
  ja,
  ko,
  kk,
  nl,
  pl,
  pt,
  ro,
  ru,
  sl,
  sr,
  sv,
  tg,
  th,
  tr,
  vi,
  zh,
}

/**
 * Export all formatter functions.
 */
export * from './formatters'
