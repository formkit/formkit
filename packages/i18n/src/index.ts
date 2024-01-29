/**
 * The official FormKit internationalization (i18n) plugin. This package
 * contains the locales and the plugin that integrates FormKit with these
 * locales. Read the {@link https://formkit.com/essentials/internationalization
 * | internationalization documentation} for usage instructions.
 *
 * @packageDocumentation
 */

import { ar } from './locales/ar'
import { az } from './locales/az'
import { bg } from './locales/bg'
import { bs } from './locales/bs'
import { ca } from './locales/ca'
import { cs } from './locales/cs'
import { da } from './locales/da'
import { de } from './locales/de'
import { el } from './locales/el'
import { en } from './locales/en'
import { es } from './locales/es'
import { fa } from './locales/fa'
import { fi } from './locales/fi'
import { fr } from './locales/fr'
import { fy } from './locales/fy'
import { he } from './locales/he'
import { hr } from './locales/hr'
import { hu } from './locales/hu'
import { id } from './locales/id'
import { is } from './locales/is'
import { it } from './locales/it'
import { ja } from './locales/ja'
import { kk } from './locales/kk'
import { ko } from './locales/ko'
import { lt } from './locales/lt'
import { lv } from './locales/lv'
import { mn } from './locales/mn'
import { nb } from './locales/nb'
import { nl } from './locales/nl'
import { pl } from './locales/pl'
import { pt } from './locales/pt'
import { ro } from './locales/ro'
import { ru } from './locales/ru'
import { sk } from './locales/sk'
import { sl } from './locales/sl'
import { sr } from './locales/sr'
import { sv } from './locales/sv'
import { tet } from './locales/tet'
import { tg } from './locales/tg'
import { th } from './locales/th'
import { tr } from './locales/tr'
import { uk } from './locales/uk'
import { uz } from './locales/uz'
import { vi } from './locales/vi'
import { zh } from './locales/zh'
import { zhTW } from './locales/zh-TW'

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
