/**
 * The official FormKit internationalization (i18n) plugin. This package
 * contains the locales and the plugin that integrates FormKit with these
 * locales. Read the {@link https://formkit.com/essentials/internationalization
 * | internationalization documentation} for usage instructions.
 *
 * @packageDocumentation
 */

import { default as ar } from './locales/ar'
import { default as az } from './locales/az'
import { default as bg } from './locales/bg'
import { default as bs } from './locales/bs'
import { default as ca } from './locales/ca'
import { default as cs } from './locales/cs'
import { default as da } from './locales/da'
import { default as de } from './locales/de'
import { default as el } from './locales/el'
import { default as en } from './locales/en'
import { default as es } from './locales/es'
import { default as fa } from './locales/fa'
import { default as fi } from './locales/fi'
import { default as fr } from './locales/fr'
import { default as fy } from './locales/fy'
import { default as he } from './locales/he'
import { default as hr } from './locales/hr'
import { default as hu } from './locales/hu'
import { default as id } from './locales/id'
import { default as is } from './locales/is'
import { default as it } from './locales/it'
import { default as ja } from './locales/ja'
import { default as kk } from './locales/kk'
import { default as ko } from './locales/ko'
import { default as lt } from './locales/lt'
import { default as lv } from './locales/lv'
import { default as mn } from './locales/mn'
import { default as nb } from './locales/nb'
import { default as nl } from './locales/nl'
import { default as pl } from './locales/pl'
import { default as pt } from './locales/pt'
import { default as ro } from './locales/ro'
import { default as ru } from './locales/ru'
import { default as sk } from './locales/sk'
import { default as sl } from './locales/sl'
import { default as sr } from './locales/sr'
import { default as sv } from './locales/sv'
import { default as tet } from './locales/tet'
import { default as tg } from './locales/tg'
import { default as th } from './locales/th'
import { default as tr } from './locales/tr'
import { default as uk } from './locales/uk'
import { default as uz } from './locales/uz'
import { default as vi } from './locales/vi'
import { default as zh } from './locales/zh'
import { default as zhTW } from './locales/zh-TW'

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
  bs,
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
  lv,
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
  tet,
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
  bs,
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
  lv,
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
  tet,
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
