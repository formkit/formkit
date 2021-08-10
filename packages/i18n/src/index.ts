import * as en from './locales/en'

/**
 * Export all of the plugin logic
 */
export * from './i18n'

/**
 * Export all the available locales at once.
 */
export const locales = {
  en,
}

/**
 * Export each locale individually for people who want to cherry pick.
 */
export { en }
