import * as en from './locales/en'
import * as de from './locales/de'
import * as fr from './locales/fr'
import * as ru from './locales/ru'

/**
 * Export all of the plugin logic
 */
export * from './i18n'

/**
 * Export all the available locales at once.
 * @public
 */
export const locales = {
  en,
  de,
  fr,
  ru,
}

/**
 * Export each locale individually for people who want to cherry pick.
 */
export { en, de, fr }
