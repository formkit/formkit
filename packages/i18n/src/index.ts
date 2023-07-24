/**
 * The official FormKit internationalization (i18n) plugin. This package
 * contains the locales and the plugin that integrates FormKit with these
 * locales. Read the {@link https://formkit.com/essentials/internationalization
 * | internationalization documentation} for usage instructions.
 *
 * @packageDocumentation
 */

import * as ar from './locales/ar'
import * as az from './locales/az'
import * as bg from './locales/bg'
import * as ca from './locales/ca'
import * as cs from './locales/cs'
import * as da from './locales/da'
import * as de from './locales/de'
import * as el from './locales/el'
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
import * as is from './locales/is'
import * as it from './locales/it'
import * as ja from './locales/ja'
import * as kk from './locales/kk'
import * as ko from './locales/ko'
import * as lt from './locales/lt'
import * as mn from './locales/mn'
import * as nb from './locales/nb'
import * as nl from './locales/nl'
import * as pl from './locales/pl'
import * as pt from './locales/pt'
import * as ro from './locales/ro'
import * as ru from './locales/ru'
import * as sk from './locales/sk'
import * as sl from './locales/sl'
import * as sr from './locales/sr'
import * as sv from './locales/sv'
import * as tg from './locales/tg'
import * as th from './locales/th'
import * as tr from './locales/tr'
import * as uk from './locales/uk'
import * as uz from './locales/uz'
import * as vi from './locales/vi'
import * as zh from './locales/zh'
import * as zhTW from './locales/zh-TW'

/**
 * Export all of the plugin logic
 */
export * from './i18n'

/**
 * Export all the available locales at once.
 *
 * @public
 */
export const locales = {
  ar,
  az,
  bg,
  ca,
  cs,
  da,
  de,
  el,
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
  lt,
  nb,
  nl,
  pl,
  pt,
  ro,
  ru,
  sk,
  sl,
  sr,
  sv,
  tg,
  th,
  tr,
  uk,
  uz,
  vi,
  zh,
  'zh-TW': zhTW,
  is,
  mn,
}

/**
 * Export each locale individually for people who want to cherry pick.
 */
export {
  ar,
  az,
  bg,
  ca,
  cs,
  da,
  de,
  el,
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
  lt,
  nb,
  nl,
  pl,
  pt,
  ro,
  ru,
  sk,
  sl,
  sr,
  sv,
  tg,
  th,
  tr,
  uk,
  uz,
  vi,
  zh,
  zhTW,
  is,
  mn,
}

/**
 * Export all formatter functions.
 */
export * from './formatters'
