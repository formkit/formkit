import { FormKitValidationMessages } from '@formkit/validation'

/**
 * Here we can import additional helper functions to assist in formatting our
 * language. Feel free to add additional helper methods to libs/formats if it
 * assists in creating good validation messages for your locale.
 */
import { sentence as s } from '../formatters'
import { FormKitLocaleMessages } from '../i18n'

/**
 * Standard language for interface features.
 * @public
 */
export const ui: FormKitLocaleMessages = {
  remove: 'Remove',
}

/**
 * These are all the possible strings that pertain to validation messages.
 * @public
 */
export const validation: FormKitValidationMessages = {
  /**
   * Valid accepted value.
   */
  accepted({ name }): string {
    return `Please accept the ${name}.`
  },

  /**
   * The date is not after.
   */
  after({ name, args }) {
    if (Array.isArray(args) && args.length) {
      return `${s(name)} must be after ${args[0]}.`
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
   * Rule: checks if the value is alpha numeric
   */
  alphanumeric({ name }) {
    return `${s(name)} can only contain letters and numbers.`
  },

  /**
   * The date is not before.
   */
  before({ name, args }) {
    if (Array.isArray(args) && args.length) {
      return `${s(name)} must be before ${args[0]}.`
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
   * Is not a valid date.
   */
  date_format({ name, args }) {
    if (Array.isArray(args) && args.length) {
      return `${s(name)} is not a valid date, please use the format ${args[0]}`
    }
    return `${s(name)} is not a valid date.`
  },

  /**
   * Is not a valid date.
   */
  date_between({ name, args }) {
    return `${s(name)} must be between ${args[0]} and ${args[1]}`
  },

  /**
   * Is not a valid email address.
   */
  email: 'Please enter a valid email address.',

  /**
   * Ends with specified value
   */
  ends_with({ name }) {
    return `${s(name)} must doesn’t end with a valid value.`
  },

  /**
   * Value is an allowed value.
   */
  is({ name }) {
    return `${s(name)} is not an allowed value.`
  },

  /**
   * The character length.
   */
  length({ name, args }) {
    if (args.length === 1) {
      return `${s(name)} must be at least ${args[0]} character.`
    }
    if (!args[0] && args[1]) {
      return `${s(name)} must be less than ${args[1]} characters.`
    }
    return `${s(name)} must be between ${args[0] || '0'} and ${
      args[1] || '0'
    } characters.`
  },

  /**
   * Value is not a match.
   */
  matches({ name }) {
    return `${s(name)} is not an allowed value.`
  },

  /**
   * The maximum value allowed.
   */
  max({ name, node: { value }, args }) {
    if (Array.isArray(value)) {
      return `You may only select ${args[0]} ${name}.`
    }
    return `${s(name)} must be less than or equal to ${args[0]}.`
  },

  /**
   * The (field-level) error message for mime errors.
   */
  mime({ name, args }) {
    return `${s(name)} must be of the type: ${
      args[0] || 'No file formats allowed.'
    }`
  },

  /**
   * The maximum value allowed.
   */
  min({ name, node: { value }, args }) {
    if (Array.isArray(value)) {
      return `You need at least ${args[0]} ${name}.`
    }
    return `${s(name)} must be at least ${args[0]}.`
  },

  /**
   * The field is not an allowed value
   */
  not({ name, node: { value } }) {
    return `“${value}” is not an allowed ${name}.`
  },

  /**
   * The field is not a number
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
   * Starts with specified value
   */
  startsWith({ name }) {
    return `${s(name)} doesn’t start with a valid value.`
  },

  /**
   * Value is not a url.
   */
  url() {
    return `Please include a valid url.`
  },
}
