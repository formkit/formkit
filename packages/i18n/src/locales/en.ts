import { FormKitValidationMessages } from '@formkit/validation'

/**
 * Here we can import additional helper functions to assist in formatting our
 * language. Feel free to add additional helper methods to libs/formats if it
 * assists in creating good validation messages for your locale.
 */
import { sentence as s, list, date } from '../formatters'
import { FormKitLocaleMessages } from '../i18n'

/**
 * Standard language for interface features.
 * @public
 */
export const ui: FormKitLocaleMessages = {
  /**
   * Shown when a button to remove items is visible.
   */
  remove: 'Remove',
  incomplete: 'Sorry, not all fields are filled out correctly.',
  submit: 'Submit',
}

/**
 * These are all the possible strings that pertain to validation messages.
 * @public
 */
export const validation: FormKitValidationMessages = {
  /**
   * Valid accepted value.
   * @see {@link https://docs.formkit.com/essentials/validation#accepted}
   */
  accepted({ name }): string {
    /* <i18n case="write a description"> */
    return `Please accept the ${name}.`
    /* </i18n> */
  },

  /**
   * The date is not after
   */
  date_after({ name, args }) {
    if (Array.isArray(args) && args.length) {
      /* <i18n case="write a description"> */
      return `${s(name)} must be after ${date(args[0])}.`
      /* </i18n> */
    }
    return `${s(name)} must be in the future.`
  },

  /**
   * The value is not a letter.
   */
  alpha({ name }) {
    return `${s(name)} can only contain alphabetical characters.`
  },

  /**
   The value is not alphanumeric
   */
  alphanumeric({ name }) {
    return `${s(name)} can only contain letters and numbers.`
  },

  /**
   * The date is not before
   */
  date_before({ name, args }) {
    if (Array.isArray(args) && args.length) {
      return `${s(name)} must be before ${date(args[0])}.`
    }
    return `${s(name)} must be an earlier date.`
  },

  /**
   * The value is not between two numbers or lengths
   */
  between({ name, args }) {
    return `${s(name)} must be between ${args[0] || 'n/a'} and ${
      args[1] || 'n/a'
    }.`
  },

  /**
   * The confirmation field does not match
   */
  confirm({ name }) {
    return `${s(name)} does not match.`
  },

  /**
   * The value is not a valid date
   */
  date_format({ name, args }) {
    if (Array.isArray(args) && args.length) {
      return `${s(name)} is not a valid date, please use the format ${args[0]}`
    }
    return `${s(name)} is not a valid date.`
  },

  /**
   * Is not within expected date range
   */
  date_between({ name, args }) {
    return `${s(name)} must be between ${date(args[0])} and ${date(args[1])}`
  },

  /**
   * Is not a valid email address
   */
  email: 'Please enter a valid email address.',

  /**
   * Does not end with the specified value
   */
  ends_with({ name, args }) {
    return `${s(name)} doesn’t end with ${list(args)}.`
  },

  /**
   * Is not an allowed value
   */
  is({ name }) {
    return `${s(name)} is not an allowed value.`
  },

  /**
   * Does not match specified length
   */
  length({ name, args }) {
    if (args[0] == 1 && !args[1]) {
      return `${s(name)} must be at least one character.`
    }
    if (!args[0] && args[1]) {
      return `${s(name)} must be less than ${args[1]} characters.`
    }
    return `${s(name)} must be between ${args[0] || '0'} and ${
      args[1] || '0'
    } characters.`
  },

  /**
   * Value is not a match
   */
  matches({ name }) {
    return `${s(name)} is not an allowed value.`
  },

  /**
   * Exceeds maximum allowed value
   */
  max({ name, node: { value }, args }) {
    if (Array.isArray(value)) {
      return `You may only select ${args[0]} ${name}.`
    }
    return `${s(name)} must be less than or equal to ${args[0]}.`
  },

  /**
   * The (field-level) value does not match specified mime type
   */
  mime({ name, args }) {
    return `${s(name)} must be of the type: ${
      args[0] || 'No file formats allowed.'
    }`
  },

  /**
   * Does not fulfill minimum allowed value
   */
  min({ name, node: { value }, args }) {
    if (Array.isArray(value)) {
      return `You need at least ${args[0]} ${name}.`
    }
    return `${s(name)} must be at least ${args[0]}.`
  },

  /**
   * Is not an allowed value
   */
  not({ name, node: { value } }) {
    return `“${value}” is not an allowed ${name}.`
  },

  /**
   *  Is not a number
   */
  number({ name }) {
    return `${s(name)} must be a number.`
  },

  /**
   * Required field.
   */
  required({ name }) {
    return `${s(name)} is required.`
  },

  /**
   * Does not start with specified value
   */
  starts_with({ name, args }) {
    return `${s(name)} doesn’t start with ${list(args)}.`
  },

  /**
   * Is not a url
   */
  url() {
    return `Please include a valid url.`
  },
}
