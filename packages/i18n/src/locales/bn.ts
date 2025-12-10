import {
  FormKitValidationMessages,
  createMessageName,
} from '@formkit/validation'

/**
 * Here we can import additional helper functions to assist in formatting our
 * language. Feel free to add additional helper methods to libs/formats if it
 * assists in creating good validation messages for your locale.
 */
import { sentence as s, list, date, order } from '../formatters'
import { FormKitLocaleMessages } from '../i18n'

/**
 * Standard language for interface features.
 * @public
 */
const ui: FormKitLocaleMessages = {
  /**
   * Shown on a button for adding additional items.
   */
  add: 'যোগ করুন',
  /**
   * Shown when a button to remove items is visible.
   */
  remove: 'অপসারণ করুন',
  /**
   * Shown when there are multiple items to remove at the same time.
   */
  removeAll: 'সব অপসারণ করুন',
  /**
   * Shown when all fields are not filled out correctly.
   */
  incomplete: 'দুঃখিত, সমস্ত ক্ষেত্র সঠিকভাবে পূরণ করা হয়নি।',
  /**
   * Shown in a button inside a form to submit the form.
   */
  submit: 'জমা দিন',
  /**
   * Shown when no files are selected.
   */
  noFiles: 'কোন ফাইল নির্বাচন করা হয়নি',
  /**
   * Shown on buttons that move fields up in a list.
   */
  moveUp: 'উপরে সরান',
  /**
   * Shown on buttons that move fields down in a list.
   */
  moveDown: 'নিচে সরান',
  /**
   * Shown when something is actively loading.
   */
  isLoading: 'লোড হচ্ছে...',
  /**
   * Shown when there is more to load.
   */
  loadMore: 'আরও লোড করুন',
  /**
   * Show on buttons that navigate state forward
   */
  next: 'পরবর্তী',
  /**
   * Show on buttons that navigate state backward
   */
  prev: 'পূর্ববর্তী',
  /**
   * Shown when adding all values.
   */
  addAllValues: 'সমস্ত মান যোগ করুন',
  /**
   * Shown when adding selected values.
   */
  addSelectedValues: 'নির্বাচিত মান যোগ করুন',
  /**
   * Shown when removing all values.
   */
  removeAllValues: 'সমস্ত মান অপসারণ করুন',
  /**
   * Shown when removing selected values.
   */
  removeSelectedValues: 'নির্বাচিত মান অপসারণ করুন',
  /**
   * Shown when there is a date to choose.
   */
  chooseDate: 'তারিখ নির্বাচন করুন',
  /**
   * Shown when there is a date to change.
   */
  changeDate: 'তারিখ পরিবর্তন করুন',
  /**
   * Shown above error summaries when someone attempts to submit a form with
   * errors and the developer has implemented `<FormKitSummary />`.
   */
  summaryHeader: 'আপনার ফর্মে ত্রুটি ছিল।',
  /*
   * Shown when there is something to close
   */
  close: 'বন্ধ করুন',
  /**
   * Shown when there is something to open.
   */
  open: 'খুলুন',
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
    return `অনুগ্রহ করে ${name} গ্রহণ করুন।`
    /* </i18n> */
  },

  /**
   * The date is not after
   * @see {@link https://formkit.com/essentials/validation#date-after}
   */
  date_after({ name, args }) {
    if (Array.isArray(args) && args.length) {
      /* <i18n case="Shown when the user-provided date is not after the date supplied to the rule."> */
      return `${s(name)} অবশ্যই ${date(args[0])} এর পরে হতে হবে।`
      /* </i18n> */
    }
    /* <i18n case="Shown when the user-provided date is not after today's date, since no date was supplied to the rule."> */
    return `${s(name)} অবশ্যই ভবিষ্যতের হতে হবে।`
    /* </i18n> */
  },

  /**
   * The value is not a letter.
   * @see {@link https://formkit.com/essentials/validation#alpha}
   */
  alpha({ name }) {
    /* <i18n case="Shown when the user-provided value contains non-alphabetical characters."> */
    return `${s(name)} শুধুমাত্র বর্ণমালা ধারণ করতে পারে।`
    /* </i18n> */
  },

  /**
   * The value is not alphanumeric
   * @see {@link https://formkit.com/essentials/validation#alphanumeric}
   */
  alphanumeric({ name }) {
    /* <i18n case="Shown when the user-provided value contains non-alphanumeric characters."> */
    return `${s(name)} শুধুমাত্র অক্ষর এবং সংখ্যা ধারণ করতে পারে।`
    /* </i18n> */
  },

  /**
   * The value is not letter and/or spaces
   * @see {@link https://formkit.com/essentials/validation#alpha-spaces}
   */
  alpha_spaces({ name }) {
    /* <i18n case="Shown when the user-provided value contains non-alphabetical and non-space characters."> */
    return `${s(name)} শুধুমাত্র অক্ষর এবং স্পেস ধারণ করতে পারে।`
    /* </i18n> */
  },

  /**
   * The value have no letter.
   * @see {@link https://formkit.com/essentials/validation#contains_alpha}
   */
  contains_alpha({ name }) {
    /* <i18n case="Shown when the user-provided value contains only non-alphabetical characters."> */
    return `${s(name)} অবশ্যই বর্ণমালা ধারণ করতে হবে।`
    /* </i18n> */
  },

  /**
   * The value have no alphanumeric
   * @see {@link https://formkit.com/essentials/validation#contains_alphanumeric}
   */
  contains_alphanumeric({ name }) {
    /* <i18n case="Shown when the user-provided value contains only non-alphanumeric characters."> */
    return `${s(name)} অবশ্যই অক্ষর বা সংখ্যা ধারণ করতে হবে।`
    /* </i18n> */
  },

  /**
   * The value have no letter and/or spaces
   * @see {@link https://formkit.com/essentials/validation#contains_alpha-spaces}
   */
  contains_alpha_spaces({ name }) {
    /* <i18n case="Shown when the user-provided value contains only non-alphabetical and non-space characters."> */
    return `${s(name)} অবশ্যই অক্ষর বা স্পেস ধারণ করতে হবে।`
    /* </i18n> */
  },

  /**
   * The value have no symbol
   * @see {@link https://formkit.com/essentials/validation#contains_symbol}
   */
  contains_symbol({ name }) {
    /* <i18n case="Shown when the user-provided value contains only alphanumeric and space characters."> */
    return `${s(name)} অবশ্যই একটি প্রতীক ধারণ করতে হবে।`
    /* </i18n> */
  },

  /**
   * The value have no uppercase
   * @see {@link https://formkit.com/essentials/validation#contains_uppercase}
   */
  contains_uppercase({ name }) {
    /* <i18n case="Shown when the user-provided value contains only non-alphabetical-uppercase characters."> */
    return `${s(name)} অবশ্যই একটি বড় হাতের অক্ষর ধারণ করতে হবে।`
    /* </i18n> */
  },

  /**
   * The value have no lowercase
   * @see {@link https://formkit.com/essentials/validation#contains_lowercase}
   */
  contains_lowercase({ name }) {
    /* <i18n case="Shown when the user-provided value contains only non-alphabetical-lowercase characters."> */
    return `${s(name)} অবশ্যই একটি ছোট হাতের অক্ষর ধারণ করতে হবে।`
    /* </i18n> */
  },

  /**
   *  The value have no numeric
   * @see {@link https://formkit.com/essentials/validation#contains_numeric}
   */
  contains_numeric({ name }) {
    /* <i18n case="Shown when the user-provided value have no numeric."> */
    return `${s(name)} অবশ্যই সংখ্যা ধারণ করতে হবে।`
    /* </i18n> */
  },
  /**
   * The value is not symbol
   * @see {@link https://formkit.com/essentials/validation#symbol}
   */
  symbol({ name }) {
    /* <i18n case="Shown when the user-provided value contains alphanumeric and space characters."> */
    return `${s(name)} অবশ্যই একটি প্রতীক হতে হবে।`
    /* </i18n> */
  },

  /**
   * The value is not uppercase
   * @see {@link https://formkit.com/essentials/validation#uppercase}
   */
  uppercase({ name }) {
    /* <i18n case="Shown when the user-provided value contains non-alphabetical-uppercase characters."> */
    return `${s(name)} শুধুমাত্র বড় হাতের অক্ষর ধারণ করতে পারে।`
    /* </i18n> */
  },

  /**
   * The value is not lowercase
   * @see {@link https://formkit.com/essentials/validation#lowercase}
   */
  lowercase({ name, args }) {
    let postfix = ''
    if (Array.isArray(args) && args.length) {
      if (args[0] === 'allow_non_alpha') postfix = ', সংখ্যা এবং প্রতীক'
      if (args[0] === 'allow_numeric') postfix = ' এবং সংখ্যা'
      if (args[0] === 'allow_numeric_dashes') postfix = ', সংখ্যা এবং ড্যাশ'
    }
    /* <i18n case="Shown when the user-provided value contains non-alphabetical-lowercase characters."> */
    return `${s(name)} শুধুমাত্র ছোট হাতের অক্ষর${postfix} ধারণ করতে পারে।`
    /* </i18n> */
  },

  /**
   * The date is not before
   * @see {@link https://formkit.com/essentials/validation#date-before}
   */
  date_before({ name, args }) {
    if (Array.isArray(args) && args.length) {
      /* <i18n case="Shown when the user-provided date is not before the date supplied to the rule."> */
      return `${s(name)} অবশ্যই ${date(args[0])} এর আগে হতে হবে।`
      /* </i18n> */
    }
    /* <i18n case="Shown when the user-provided date is not before today's date, since no date was supplied to the rule."> */
    return `${s(name)} অবশ্যই অতীতের হতে হবে।`
    /* </i18n> */
  },

  /**
   * The value is not between two numbers
   * @see {@link https://formkit.com/essentials/validation#between}
   */
  between({ name, args }) {
    if (isNaN(args[0]) || isNaN(args[1])) {
      /* <i18n case="Shown when any of the arguments supplied to the rule were not a number."> */
      return `এই ক্ষেত্রটি ভুলভাবে কনফিগার করা হয়েছে এবং জমা দেওয়া যাবে না।`
      /* </i18n> */
    }
    const [a, b] = order(args[0], args[1])
    /* <i18n case="Shown when the user-provided value is not between two numbers."> */
    return `${s(name)} অবশ্যই ${a} এবং ${b} এর মধ্যে হতে হবে।`
    /* </i18n> */
  },

  /**
   * The confirmation field does not match
   * @see {@link https://formkit.com/essentials/validation#confirm}
   */
  confirm({ name }) {
    /* <i18n case="Shown when the user-provided value does not equal the value of the matched input."> */
    return `${s(name)} মিলছে না।`
    /* </i18n> */
  },

  /**
   * The value is not a valid date
   * @see {@link https://formkit.com/essentials/validation#date-format}
   */
  date_format({ name, args }) {
    if (Array.isArray(args) && args.length) {
      /* <i18n case="Shown when the user-provided date does not satisfy the date format supplied to the rule."> */
      return `${s(name)} একটি বৈধ তারিখ নয়, অনুগ্রহ করে ${args[0]} ফরম্যাট ব্যবহার করুন`
      /* </i18n> */
    }
    /* <i18n case="Shown when no date argument was supplied to the rule."> */
    return 'এই ক্ষেত্রটি ভুলভাবে কনফিগার করা হয়েছে এবং জমা দেওয়া যাবে না'
    /* </i18n> */
  },

  /**
   * Is not within expected date range
   * @see {@link https://formkit.com/essentials/validation#date-between}
   */
  date_between({ name, args }) {
    /* <i18n case="Shown when the user-provided date is not between the start and end dates supplied to the rule. "> */
    return `${s(name)} অবশ্যই ${date(args[0])} এবং ${date(args[1])} এর মধ্যে হতে হবে`
    /* </i18n> */
  },

  /**
   * Shown when the user-provided value is not a valid email address.
   * @see {@link https://formkit.com/essentials/validation#email}
   */
  email: 'অনুগ্রহ করে একটি বৈধ ইমেল ঠিকানা লিখুন।',

  /**
   * Does not end with the specified value
   * @see {@link https://formkit.com/essentials/validation#ends-with}
   */
  ends_with({ name, args }) {
    /* <i18n case="Shown when the user-provided value does not end with the substring supplied to the rule."> */
    return `${s(name)} ${list(args)} দিয়ে শেষ হয় না।`
    /* </i18n> */
  },

  /**
   * Is not an allowed value
   * @see {@link https://formkit.com/essentials/validation#is}
   */
  is({ name }) {
    /* <i18n case="Shown when the user-provided value is not one of the values supplied to the rule."> */
    return `${s(name)} একটি অনুমোদিত মান নয়।`
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
      return `${s(name)} কমপক্ষে একটি অক্ষর হতে হবে।`
      /* </i18n> */
    }
    if (min == 0 && max) {
      /* <i18n case="Shown when first argument supplied to the rule is 0, and the user-provided value is longer than the max (the 2nd argument) supplied to the rule."> */
      return `${s(name)} অবশ্যই ${max} অক্ষরের কম বা সমান হতে হবে।`
      /* </i18n> */
    }
    if (min === max) {
      /* <i18n case="Shown when first and second argument supplied to the rule are the same, and the user-provided value is not any of the arguments supplied to the rule."> */
      return `${s(name)} ${max} অক্ষর দীর্ঘ হওয়া উচিত।`
      /* </i18n> */
    }
    if (min && max === Infinity) {
      /* <i18n case="Shown when the length of the user-provided value is less than the minimum supplied to the rule and there is no maximum supplied to the rule."> */
      return `${s(name)} অবশ্যই ${min} অক্ষরের বেশি বা সমান হতে হবে।`
      /* </i18n> */
    }
    /* <i18n case="Shown when the length of the user-provided value is between the two lengths supplied to the rule."> */
    return `${s(name)} অবশ্যই ${min} এবং ${max} অক্ষরের মধ্যে হতে হবে।`
    /* </i18n> */
  },

  /**
   * Value is not a match
   * @see {@link https://formkit.com/essentials/validation#matches}
   */
  matches({ name }) {
    /* <i18n case="Shown when the user-provided value does not match any of the values or RegExp patterns supplied to the rule. "> */
    return `${s(name)} একটি অনুমোদিত মান নয়।`
    /* </i18n> */
  },

  /**
   * Exceeds maximum allowed value
   * @see {@link https://formkit.com/essentials/validation#max}
   */
  max({ name, node: { value }, args }) {
    if (Array.isArray(value)) {
      /* <i18n case="Shown when the length of the array of user-provided values is longer than the max supplied to the rule."> */
      return `${args[0]} টির বেশি ${name} থাকতে পারবে না।`
      /* </i18n> */
    }
    /* <i18n case="Shown when the user-provided value is greater than the maximum number supplied to the rule."> */
    return `${s(name)} ${args[0]} এর বেশি হতে পারবে না।`
    /* </i18n> */
  },

  /**
   * The (field-level) value does not match specified mime type
   * @see {@link https://formkit.com/essentials/validation#mime}
   */
  mime({ name, args }) {
    if (!args[0]) {
      /* <i18n case="Shown when no file formats were supplied to the rule."> */
      return 'কোন ফাইল ফরম্যাট অনুমোদিত নয়।'
      /* </i18n> */
    }
    /* <i18n case="Shown when the mime type of user-provided file does not match any mime types supplied to the rule."> */
    return `${s(name)} অবশ্যই এই ধরণের হতে হবে: ${args[0]}`
    /* </i18n> */
  },

  /**
   * Does not fulfill minimum allowed value
   * @see {@link https://formkit.com/essentials/validation#min}
   */
  min({ name, node: { value }, args }) {
    if (Array.isArray(value)) {
      /* <i18n case="Shown when the length of the array of user-provided values is shorter than the min supplied to the rule."> */
      return `${args[0]} টির কম ${name} থাকতে পারবে না।`
      /* </i18n> */
    }
    /* <i18n case="Shown when the user-provided value is less than the minimum number supplied to the rule."> */
    return `${s(name)} কমপক্ষে ${args[0]} হতে হবে।`
    /* </i18n> */
  },

  /**
   * Is not an allowed value
   * @see {@link https://formkit.com/essentials/validation#not}
   */
  not({ name, node: { value } }) {
    /* <i18n case="Shown when the user-provided value matches one of the values supplied to (and thus disallowed by) the rule."> */
    return `"${value}" একটি অনুমোদিত ${name} নয়।`
    /* </i18n> */
  },

  /**
   *  Is not a number
   * @see {@link https://formkit.com/essentials/validation#number}
   */
  number({ name }) {
    /* <i18n case="Shown when the user-provided value is not a number."> */
    return `${s(name)} অবশ্যই একটি সংখ্যা হতে হবে।`
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
    return `${labels.join(' অথবা ')} প্রয়োজন।`
    /* </i18n> */
  },

  /**
   * Required field.
   * @see {@link https://formkit.com/essentials/validation#required}
   */
  required({ name }) {
    /* <i18n case="Shown when a user does not provide a value to a required input."> */
    return `${s(name)} প্রয়োজন।`
    /* </i18n> */
  },

  /**
   * Does not start with specified value
   * @see {@link https://formkit.com/essentials/validation#starts-with}
   */
  starts_with({ name, args }) {
    /* <i18n case="Shown when the user-provided value does not start with the substring supplied to the rule."> */
    return `${s(name)} ${list(args)} দিয়ে শুরু হয় না।`
    /* </i18n> */
  },

  /**
   * Is not a url
   * @see {@link https://formkit.com/essentials/validation#url}
   */
  url() {
    /* <i18n case="Shown when the user-provided value is not a valid url."> */
    return `অনুগ্রহ করে একটি বৈধ URL লিখুন।`
    /* </i18n> */
  },
  /**
   * Shown when the date is invalid.
   */
  invalidDate: 'নির্বাচিত তারিখটি অবৈধ।',
}

export const bn = { ui, validation }
