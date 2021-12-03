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
   * The value is not an accepted value.
   * @see {@link https://docs.formkit.com/essentials/validation#accepted}
   */
  accepted({ name }): string {
    /* <i18n case="Shown when the user-provided value is not a valid 'accepted' value."> */
    return `Please accept the ${name}.`
    /* </i18n> */
  },

  /**
   * The date is not after
   * @see {@link https://docs.formkit.com/essentials/validation#date-after}
   */
  date_after({ name, args }) {
    if (Array.isArray(args) && args.length) {
      /* <i18n case="Shown when the user-provided date is not after the date supplied to the rule"> */
      return `${s(name)} must be after ${date(args[0])}.`
      /* </i18n> */
    }
    /* <i18n case="Shown when the user-provided date is not after today's date, since no date was supplied to the rule."> */
    return `${s(name)} must be in the future.`
    /* </i18n> */
  },

  /**
   * The value is not a letter.
   * @see {@link https://docs.formkit.com/essentials/validation#alpha}
   */
  alpha({ name }) {
    /* <i18n case="Shown when the user-provided value contains non-alphabetical characters"> */
    return `${s(name)} can only contain alphabetical characters.`
    /* </i18n> */
  },

  /**
   * The value is not alphanumeric
   * @see {@link https://docs.formkit.com/essentials/validation#alphanumeric}
   */
  alphanumeric({ name }) {
    /* <i18n case="Shown when the user-provided value contains non-alphanumeric characters"> */
    return `${s(name)} can only contain letters and numbers.`
    /* </i18n> */
  },

  /**
   * The date is not before
   * @see {@link https://docs.formkit.com/essentials/validation#date-before}
   */
  date_before({ name, args }) {
    if (Array.isArray(args) && args.length) {
      /* <i18n case="Shown when the user-provided date is not before the date supplied to the rule"> */
      return `${s(name)} must be before ${date(args[0])}.`
      /* </i18n> */
    }
    /* <i18n case="Shown when the user-provided date is not before today's date, since no date was supplied to the rule."> */
    return `${s(name)} must be in the past.`
    /* </i18n> */
  },

  /**
   * The value is not between two numbers or lengths
   * @see {@link https://docs.formkit.com/essentials/validation#between}
   */
  between({ name, args }) {
    if (isNaN(args[0]) || isNaN(args[1])) {
      return `This field was configured incorrectly and can’t be submitted.`
    }
    return `${s(name)} must be between ${args[0]} and ${args[1]}.`
  },

  /**
   * The confirmation field does not match
   * @see {@link https://docs.formkit.com/essentials/validation#confirm}
   */
  confirm({ name }) {
    return `${s(name)} does not match.`
  },

  /**
   * The value is not a valid date
   * @see {@link https://docs.formkit.com/essentials/validation#date-format}
   */
  date_format({ name, args }) {
    if (Array.isArray(args) && args.length) {
      return `${s(name)} is not a valid date, please use the format ${args[0]}`
    }
    return `${s(name)} is not a valid date.`
  },

  /**
   * Is not within expected date range
   * @see {@link https://docs.formkit.com/essentials/validation#date-between}
   */
  date_between({ name, args }) {
    return `${s(name)} must be between ${date(args[0])} and ${date(args[1])}`
  },

  /**
   * Is not a valid email address
   * @see {@link https://docs.formkit.com/essentials/validation#email}
   */
  email: 'Please enter a valid email address.',

  /**
   * Does not end with the specified value
   * @see {@link https://docs.formkit.com/essentials/validation#ends-with}
   */
  ends_with({ name, args }) {
    return `${s(name)} doesn’t end with ${list(args)}.`
  },

  /**
   * Is not an allowed value
   * @see {@link https://docs.formkit.com/essentials/validation#is}
   */
  is({ name }) {
    return `${s(name)} is not an allowed value.`
  },

  /**
   * Does not match specified length
   * @see {@link https://docs.formkit.com/essentials/validation#length}
   */
  length({ name, args: [first = 0, second = Infinity] }) {
    const min = first <= second ? first : second
    const max = second >= first ? second : first
    if (min == 1 && max === Infinity) {
      return `${s(name)} must be at least one character.`
    }
    if (min == 0 && max) {
      return `${s(name)} must be less than or equal to ${max} characters.`
    }
    if (min && max === Infinity) {
      return `${s(name)} must be greater than or equal to ${min} characters.`
    }
    return `${s(name)} must be between ${min} and ${max} characters.`
  },

  /**
   * Value is not a match
   * @see {@link https://docs.formkit.com/essentials/validation#matches}
   */
  matches({ name }) {
    return `${s(name)} is not an allowed value.`
  },

  /**
   * Exceeds maximum allowed value
   * @see {@link https://docs.formkit.com/essentials/validation#max}
   */
  max({ name, node: { value }, args }) {
    if (Array.isArray(value)) {
      return `You may only select ${args[0]} ${name}.`
    }
    return `${s(name)} must be less than or equal to ${args[0]}.`
  },

  /**
   * The (field-level) value does not match specified mime type
   * @see {@link https://docs.formkit.com/essentials/validation#mime}
   */
  mime({ name, args }) {
    if (!args[0]) return 'No file formats allowed.'
    return `${s(name)} must be of the type: ${args[0]}`
  },

  /**
   * Does not fulfill minimum allowed value
   * @see {@link https://docs.formkit.com/essentials/validation#min}
   */
  min({ name, node: { value }, args }) {
    if (Array.isArray(value)) {
      return `You need at least ${args[0]} ${name}.`
    }
    return `${s(name)} must be at least ${args[0]}.`
  },

  /**
   * Is not an allowed value
   * @see {@link https://docs.formkit.com/essentials/validation#not}
   */
  not({ name, node: { value } }) {
    return `“${value}” is not an allowed ${name}.`
  },

  /**
   *  Is not a number
   * @see {@link https://docs.formkit.com/essentials/validation#number}
   */
  number({ name }) {
    return `${s(name)} must be a number.`
  },

  /**
   * Required field.
   * @see {@link https://docs.formkit.com/essentials/validation#required}
   */
  required({ name }) {
    return `${s(name)} is required.`
  },

  /**
   * Does not start with specified value
   * @see {@link https://docs.formkit.com/essentials/validation#starts-with}
   */
  starts_with({ name, args }) {
    return `${s(name)} doesn’t start with ${list(args)}.`
  },

  /**
   * Is not a url
   * @see {@link https://docs.formkit.com/essentials/validation#url}
   */
  url() {
    return `Please include a valid url.`
  },
}
