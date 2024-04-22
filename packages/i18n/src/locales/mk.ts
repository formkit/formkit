import type { FormKitValidationMessages } from '@formkit/validation'
import { createMessageName } from '@formkit/validation'

/**
 * Here we can import additional helper functions to assist in formatting our
 * language. Feel free to add additional helper methods to libs/formats if it
 * assists in creating good validation messages for your locale.
 */
import { sentence as s, list, date, order } from '../formatters'
import type { FormKitLocaleMessages } from '../i18n'

/**
 * Standard language for interface features.
 * @public
 */
const ui: FormKitLocaleMessages = {
  /**
   * Shown on a button for adding additional items.
   */
  add: 'Додај',
  /**
   * Shown when a button to remove items is visible.
   */
  remove: 'Отстрани',
  /**
   * Shown when there are multiple items to remove at the same time.
   */
  removeAll: 'Отстрани ги сите',
  /**
   * Shown when all fields are not filled out correctly.
   */
  incomplete:
    'Жалиме, некои од полињата на формуларот не се пополнети правилно.',
  /**
   * Shown in a button inside a form to submit the form.
   */
  submit: 'Испрати',
  /**
   * Shown when no files are selected.
   */
  noFiles: 'Немате одбрано датотека',
  /**
   * Shown on buttons that move fields up in a list.
   */
  moveUp: 'Качи нагоре',
  /**
   * Shown on buttons that move fields down in a list.
   */
  moveDown: 'Симни надолу',
  /**
   * Shown when something is actively loading.
   */
  isLoading: 'Се вчитува...',
  /**
   * Shown when there is more to load.
   */
  loadMore: 'Вчитај повеќе',
  /**
   * Show on buttons that navigate state forward
   */
  next: 'Следно',
  /**
   * Show on buttons that navigate state backward
   */
  prev: 'Претходно',
  /**
   * Shown when adding all values.
   */
  addAllValues: 'Додај ги сите вредности',
  /**
   * Shown when adding selected values.
   */
  addSelectedValues: 'Додај ги одбраните вредности',
  /**
   * Shown when removing all values.
   */
  removeAllValues: 'Отстрани ги сите вредности',
  /**
   * Shown when removing selected values.
   */
  removeSelectedValues: 'Отстрани ги одрбаните вредности',
  /**
   * Shown when there is a date to choose.
   */
  chooseDate: 'Одбери датум',
  /**
   * Shown when there is a date to change.
   */
  changeDate: 'Промени датум',
  /**
   * Shown above error summaries when someone attempts to submit a form with
   * errors and the developer has implemented `<FormKitSummary />`.
   */
  summaryHeader: 'Имаше грешки во Вашиот формулар.',
  /*
   * Shown when there is something to close
   */
  close: 'Затвори',
  /**
   * Shown when there is something to open.
   */
  open: 'Отвори',
}

/**
 * These are all the possible strings that pertain to validation messages.
 * @public
 */
const validation: FormKitValidationMessages = {
  /**
   * The value is not an accepted value.
   * @see {@link https://formkit.com/essentials/validation#accepted}
   */
  accepted({ name }): string {
    /* <i18n case="Shown when the user-provided value is not a valid 'accepted' value."> */
    return `Ве молиме да го прифатите ${name}.`
    /* </i18n> */
  },

  /**
   * The date is not after
   * @see {@link https://formkit.com/essentials/validation#date-after}
   */
  date_after({ name, args }) {
    if (Array.isArray(args) && args.length) {
      /* <i18n case="Shown when the user-provided date is not after the date supplied to the rule."> */
      return `${s(name)} мора да следи по ${date(args[0])}.`
      /* </i18n> */
    }
    /* <i18n case="Shown when the user-provided date is not after today's date, since no date was supplied to the rule."> */
    return `${s(name)} мора да биде поставено во иднина.`
    /* </i18n> */
  },

  /**
   * The value is not a letter.
   * @see {@link https://formkit.com/essentials/validation#alpha}
   */
  alpha({ name }) {
    /* <i18n case="Shown when the user-provided value contains non-alphabetical characters."> */
    return `${s(name)} може да содржи само букви.`
    /* </i18n> */
  },

  /**
   * The value is not alphanumeric
   * @see {@link https://formkit.com/essentials/validation#alphanumeric}
   */
  alphanumeric({ name }) {
    /* <i18n case="Shown when the user-provided value contains non-alphanumeric characters."> */
    return `${s(name)} може да содржи само букви и бројки.`
    /* </i18n> */
  },

  /**
   * The value is not letter and/or spaces
   * @see {@link https://formkit.com/essentials/validation#alpha-spaces}
   */
  alpha_spaces({ name }) {
    /* <i18n case="Shown when the user-provided value contains non-alphabetical and non-space characters."> */
    return `${s(name)} може да содржи само букви и празни места.`
    /* </i18n> */
  },

  /**
   * The value have no letter.
   * @see {@link https://formkit.com/essentials/validation#contains_alpha}
   */
  contains_alpha({ name }) {
    /* <i18n case="Shown when the user-provided value contains only non-alphabetical characters."> */
    return `${s(name)} мора да содржи букви.`
    /* </i18n> */
  },

  /**
   * The value have no alphanumeric
   * @see {@link https://formkit.com/essentials/validation#contains_alphanumeric}
   */
  contains_alphanumeric({ name }) {
    /* <i18n case="Shown when the user-provided value contains only non-alphanumeric characters."> */
    return `${s(name)} мора да содржи букви и бројки.`
    /* </i18n> */
  },

  /**
   * The value have no letter and/or spaces
   * @see {@link https://formkit.com/essentials/validation#contains_alpha-spaces}
   */
  contains_alpha_spaces({ name }) {
    /* <i18n case="Shown when the user-provided value contains only non-alphabetical and non-space characters."> */
    return `${s(name)} мора да содржи букви и празни места.`
    /* </i18n> */
  },

  /**
   * The value have no symbol
   * @see {@link https://formkit.com/essentials/validation#contains_symbol}
   */
  contains_symbol({ name }) {
    /* <i18n case="Shown when the user-provided value contains only alphanumeric and space characters."> */
    return `${s(name)} мора да содржи специјален или интерпункциски знак.`
    /* </i18n> */
  },

  /**
   * The value have no uppercase
   * @see {@link https://formkit.com/essentials/validation#contains_uppercase}
   */
  contains_uppercase({ name }) {
    /* <i18n case="Shown when the user-provided value contains only non-alphabetical-uppercase characters."> */
    return `${s(name)} мора да содржи голема буква.`
    /* </i18n> */
  },

  /**
   * The value have no lowercase
   * @see {@link https://formkit.com/essentials/validation#contains_lowercase}
   */
  contains_lowercase({ name }) {
    /* <i18n case="Shown when the user-provided value contains only non-alphabetical-lowercase characters."> */
    return `${s(name)} мора да содржи мала буква.`
    /* </i18n> */
  },

  /**
   *  The value have no numeric
   * @see {@link https://formkit.com/essentials/validation#contains_numeric}
   */
  contains_numeric({ name }) {
    /* <i18n case="Shown when the user-provided value have no numeric."> */
    return `${s(name)} мора да содржи бројки.`
    /* </i18n> */
  },
  /**
   * The value is not symbol
   * @see {@link https://formkit.com/essentials/validation#symbol}
   */
  symbol({ name }) {
    /* <i18n case="Shown when the user-provided value contains alphanumeric and space characters."> */
    return `${s(name)} мора да е специјален или интерпункциски знак.`
    /* </i18n> */
  },

  /**
   * The value is not uppercase
   * @see {@link https://formkit.com/essentials/validation#uppercase}
   */
  uppercase({ name }) {
    /* <i18n case="Shown when the user-provided value contains non-alphabetical-uppercase characters."> */
    return `${s(name)} може да содржи само големи букви.`
    /* </i18n> */
  },

  /**
   * The value is not lowercase
   * @see {@link https://formkit.com/essentials/validation#lowercase}
   */
  lowercase({ name, args }) {
    let postfix = ''
    if (Array.isArray(args) && args.length) {
      if (args[0] === 'allow_non_alpha')
        postfix = ', броеви и специјални или интерпункциски знаци'
      if (args[0] === 'allow_numeric') postfix = ' и броеви'
      if (args[0] === 'allow_numeric_dashes') postfix = ', броеви и цртички'
    }
    /* <i18n case="Shown when the user-provided value contains non-alphabetical-lowercase characters."> */
    return `${s(name)} може да содржи само мали букви${postfix}.`
    /* </i18n> */
  },

  /**
   * The date is not before
   * @see {@link https://formkit.com/essentials/validation#date-before}
   */
  date_before({ name, args }) {
    if (Array.isArray(args) && args.length) {
      /* <i18n case="Shown when the user-provided date is not before the date supplied to the rule."> */
      return `${s(name)} мора да биде пред ${date(args[0])}.`
      /* </i18n> */
    }
    /* <i18n case="Shown when the user-provided date is not before today's date, since no date was supplied to the rule."> */
    return `${s(name)} мора да е во минатото.`
    /* </i18n> */
  },

  /**
   * The value is not between two numbers
   * @see {@link https://formkit.com/essentials/validation#between}
   */
  between({ name, args }) {
    if (isNaN(args[0]) || isNaN(args[1])) {
      /* <i18n case="Shown when any of the arguments supplied to the rule were not a number."> */
      return `Ова поле беше лошо конфигурирано и не може да се испрати.`
      /* </i18n> */
    }
    const [a, b] = order(args[0], args[1])
    /* <i18n case="Shown when the user-provided value is not between two numbers."> */
    return `${s(name)} мора да биде помеѓу ${a} и ${b}.`
    /* </i18n> */
  },

  /**
   * The confirmation field does not match
   * @see {@link https://formkit.com/essentials/validation#confirm}
   */
  confirm({ name }) {
    /* <i18n case="Shown when the user-provided value does not equal the value of the matched input."> */
    return `${s(name)} не се совпаѓаат.`
    /* </i18n> */
  },

  /**
   * The value is not a valid date
   * @see {@link https://formkit.com/essentials/validation#date-format}
   */
  date_format({ name, args }) {
    if (Array.isArray(args) && args.length) {
      /* <i18n case="Shown when the user-provided date does not satisfy the date format supplied to the rule."> */
      return `${s(
        name
      )} не е валиден датум, Ве молиме користете го следниот формат ${args[0]}`
      /* </i18n> */
    }
    /* <i18n case="Shown when no date argument was supplied to the rule."> */
    return 'Ова поле беше лошо конфигурирано и не може да се испрати.'
    /* </i18n> */
  },

  /**
   * Is not within expected date range
   * @see {@link https://formkit.com/essentials/validation#date-between}
   */
  date_between({ name, args }) {
    /* <i18n case="Shown when the user-provided date is not between the start and end dates supplied to the rule. "> */
    return `${s(name)} мора да биде помеѓу ${date(args[0])} и ${date(args[1])}`
    /* </i18n> */
  },

  /**
   * Shown when the user-provided value is not a valid email address.
   * @see {@link https://formkit.com/essentials/validation#email}
   */
  email: 'Ве молиме внесете валидна адреса на е-пошта (e-mail).',

  /**
   * Does not end with the specified value
   * @see {@link https://formkit.com/essentials/validation#ends-with}
   */
  ends_with({ name, args }) {
    /* <i18n case="Shown when the user-provided value does not end with the substring supplied to the rule."> */
    return `${s(name)} не завршува со ${list(args)}.`
    /* </i18n> */
  },

  /**
   * Is not an allowed value
   * @see {@link https://formkit.com/essentials/validation#is}
   */
  is({ name }) {
    /* <i18n case="Shown when the user-provided value is not one of the values supplied to the rule."> */
    return `${s(name)} е недозволена вредност.`
    /* </i18n> */
  },

  /**
   * Does not match specified length
   * @see {@link https://formkit.com/essentials/validation#length}
   */
  length({ name, args: [first = 0, second = Infinity] }) {
    const min = Number(first) <= Number(second) ? first : second
    const max = Number(second) >= Number(first) ? second : first
    if (min == 1 && max === Infinity) {
      /* <i18n case="Shown when the length of the user-provided value is not at least one character."> */
      return `${s(name)} мора да биде барем еден знак.`
      /* </i18n> */
    }
    if (min == 0 && max) {
      /* <i18n case="Shown when first argument supplied to the rule is 0, and the user-provided value is longer than the max (the 2nd argument) supplied to the rule."> */
      return `${s(name)} мора да биде помалку или еднакво на ${max} знаци.`
      /* </i18n> */
    }
    if (min === max) {
      /* <i18n case="Shown when first and second argument supplied to the rule are the same, and the user-provided value is not any of the arguments supplied to the rule."> */
      return `${s(name)} мора да биде долго ${max} знаци.`
      /* </i18n> */
    }
    if (min && max === Infinity) {
      /* <i18n case="Shown when the length of the user-provided value is less than the minimum supplied to the rule and there is no maximum supplied to the rule."> */
      return `${s(name)} мора да биде поголемо или еднакво на ${min} знаци.`
      /* </i18n> */
    }
    /* <i18n case="Shown when the length of the user-provided value is between the two lengths supplied to the rule."> */
    return `${s(name)} мора да биде помеѓу ${min} и ${max} знаци.`
    /* </i18n> */
  },

  /**
   * Value is not a match
   * @see {@link https://formkit.com/essentials/validation#matches}
   */
  matches({ name }) {
    /* <i18n case="Shown when the user-provided value does not match any of the values or RegExp patterns supplied to the rule. "> */
    return `${s(name)} е недозволена вредност.`
    /* </i18n> */
  },

  /**
   * Exceeds maximum allowed value
   * @see {@link https://formkit.com/essentials/validation#max}
   */
  max({ name, node: { value }, args }) {
    if (Array.isArray(value)) {
      /* <i18n case="Shown when the length of the array of user-provided values is longer than the max supplied to the rule."> */
      return `Не може да има повеќе од ${args[0]} ${name}.`
      /* </i18n> */
    }
    /* <i18n case="Shown when the user-provided value is greater than the maximum number supplied to the rule."> */
    return `${s(name)} не смее да биде повеќе од ${args[0]}.`
    /* </i18n> */
  },

  /**
   * The (field-level) value does not match specified mime type
   * @see {@link https://formkit.com/essentials/validation#mime}
   */
  mime({ name, args }) {
    if (!args[0]) {
      /* <i18n case="Shown when no file formats were supplied to the rule."> */
      return 'Форматот на датотеката не е дозволен.'
      /* </i18n> */
    }
    /* <i18n case="Shown when the mime type of user-provided file does not match any mime types supplied to the rule."> */
    return `${s(name)} мора да биде од тип: ${args[0]}`
    /* </i18n> */
  },

  /**
   * Does not fulfill minimum allowed value
   * @see {@link https://formkit.com/essentials/validation#min}
   */
  min({ name, node: { value }, args }) {
    if (Array.isArray(value)) {
      /* <i18n case="Shown when the length of the array of user-provided values is shorter than the min supplied to the rule."> */
      return `Не смее да има помалку од ${args[0]} ${name}.`
      /* </i18n> */
    }
    /* <i18n case="Shown when the user-provided value is less than the minimum number supplied to the rule."> */
    return `${s(name)} мора да биде барем ${args[0]}.`
    /* </i18n> */
  },

  /**
   * Is not an allowed value
   * @see {@link https://formkit.com/essentials/validation#not}
   */
  not({ name, node: { value } }) {
    /* <i18n case="Shown when the user-provided value matches one of the values supplied to (and thus disallowed by) the rule."> */
    return `“${value}” не е дозволено ${name}.`
    /* </i18n> */
  },

  /**
   *  Is not a number
   * @see {@link https://formkit.com/essentials/validation#number}
   */
  number({ name }) {
    /* <i18n case="Shown when the user-provided value is not a number."> */
    return `${s(name)} мора да биде број.`
    /* </i18n> */
  },

  /**
   * Require one field.
   * @see {@link https://formkit.com/essentials/validation#require-one}
   */
  require_one: ({ name, node, args: inputNames }) => {
    const labels = inputNames
      .map((name) => {
        const dependentNode = node.at(name)
        if (dependentNode) {
          return createMessageName(dependentNode)
        }
        return false
      })
      .filter((name) => !!name)
    labels.unshift(name)
    /* <i18n case="Shown when the user-provided has not provided a value for at least one of the required fields."> */
    return `${labels.join(' or ')} е неопходен.`
    /* </i18n> */
  },

  /**
   * Required field.
   * @see {@link https://formkit.com/essentials/validation#required}
   */
  required({ name }) {
    /* <i18n case="Shown when a user does not provide a value to a required input."> */
    return `${s(name)} е неопходен.`
    /* </i18n> */
  },

  /**
   * Does not start with specified value
   * @see {@link https://formkit.com/essentials/validation#starts-with}
   */
  starts_with({ name, args }) {
    /* <i18n case="Shown when the user-provided value does not start with the substring supplied to the rule."> */
    return `${s(name)} не почнува со ${list(args)}.`
    /* </i18n> */
  },

  /**
   * Is not a url
   * @see {@link https://formkit.com/essentials/validation#url}
   */
  url() {
    /* <i18n case="Shown when the user-provided value is not a valid url."> */
    return `Ве молиме внесете валиден URL.`
    /* </i18n> */
  },
  /**
   * Shown when the date is invalid.
   */
  invalidDate: 'Одбраниот датум не е валиден.',
}

export const en = { ui, validation }
