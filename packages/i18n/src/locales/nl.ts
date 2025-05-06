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
   * Shown on buttons for adding new items.
   */
  add: 'Toevoegen',
  /**
   * Shown when a button to remove items is visible.
   */
  remove: 'Verwijderen',
  /**
   * Shown when there are multiple items to remove at the same time.
   */
  removeAll: 'Alles verwijderen',
  /**
   * Shown when all fields are not filled out correctly.
   */
  incomplete: 'Sorry, niet alle velden zijn correct ingevuld.',
  /**
   * Shown in a button inside a form to submit the form.
   */
  submit: 'Versturen',
  /**
   * Shown when no files are selected.
   */
  noFiles: 'Geen bestand gekozen',
  /**
   * Shown on buttons that move fields up in a list.
   */
  moveUp: 'Naar boven gaan',
  /**
   * Shown on buttons that move fields down in a list.
   */
  moveDown: 'Naar beneden verplaatsen',
  /**
   * Shown when something is actively loading.
   */
  isLoading: 'Aan het laden...',
  /**
   * Shown when there is more to load.
   */
  loadMore: 'Meer laden',
  /**
   * Shown on buttons that navigate state forward
   */
  next: 'Vervolgens',
  /**
   * Shown on buttons that navigate state backward
   */
  prev: 'Voorgaand',
  /**
   * Shown when adding all values.
   */
  addAllValues: 'Alle waarden toevoegen',
  /**
   * Shown when adding selected values.
   */
  addSelectedValues: 'Geselecteerde waarden toevoegen',
  /**
   * Shown when removing all values.
   */
  removeAllValues: 'Alle waarden verwijderen',
  /**
   * Shown when removing selected values.
   */
  removeSelectedValues: 'Geselecteerde waarden verwijderen',
  /**
   * Shown when there is a date to choose.
   */
  chooseDate: 'Kies een datum',
  /**
   * Shown when there is a date to change.
   */
  changeDate: 'Datum wijzigen',
  /**
   * Shown when there is something to close
   */
  close: 'Sluiten',
  /**
   * Shown when there is something to open.
   */
  open: 'Open',
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
    return `Accepteer de ${name}.`
    /* </i18n> */
  },

  /**
   * The date is not after
   * @see {@link https://formkit.com/essentials/validation#date-after}
   */
  date_after({ name, args }) {
    if (Array.isArray(args) && args.length) {
      /* <i18n case="Shown when the user-provided date is not after the date supplied to the rule."> */
      return `${s(name)} moet na ${date(args[0])} zijn.`
      /* </i18n> */
    }
    /* <i18n case="Shown when the user-provided date is not after today's date, since no date was supplied to the rule."> */
    return `${s(name)} moet in de toekomst liggen.`
    /* </i18n> */
  },

  /**
   * The value is not a letter.
   * @see {@link https://formkit.com/essentials/validation#alpha}
   */
  alpha({ name }) {
    /* <i18n case="Shown when the user-provided value contains non-alphabetical characters."> */
    return `${s(name)} mag alleen alfabetische tekens bevatten.`
    /* </i18n> */
  },

  /**
   * The value is not alphanumeric
   * @see {@link https://formkit.com/essentials/validation#alphanumeric}
   */
  alphanumeric({ name }) {
    /* <i18n case="Shown when the user-provided value contains non-alphanumeric characters."> */
    return `${s(name)} mag alleen letters en cijfers bevatten.`
    /* </i18n> */
  },

  /**
   * The value is not letter and/or spaces
   * @see {@link https://formkit.com/essentials/validation#alpha-spaces}
   */
  alpha_spaces({ name }) {
    /* <i18n case="Shown when the user-provided value contains non-alphabetical and non-space characters."> */
    return `${s(name)} mag alleen letters en spaties bevatten.`
    /* </i18n> */
  },

  /**
   * The value have no letter.
   * @see {@link https://formkit.com/essentials/validation#contains_alpha}
   */
  contains_alpha({ name }) {
    /* <i18n case="Shown when the user-provided value contains only non-alphabetical characters."> */
    return `${s(name)} moet alfabetische tekens bevatten.`
    /* </i18n> */
  },

  /**
   * The value have no alphanumeric
   * @see {@link https://formkit.com/essentials/validation#contains_alphanumeric}
   */
  contains_alphanumeric({ name }) {
    /* <i18n case="Shown when the user-provided value contains only non-alphanumeric characters."> */
    return `${s(name)} moet letters of cijfers bevatten.`
    /* </i18n> */
  },

  /**
   * The value have no letter and/or spaces
   * @see {@link https://formkit.com/essentials/validation#contains_alpha-spaces}
   */
  contains_alpha_spaces({ name }) {
    /* <i18n case="Shown when the user-provided value contains only non-alphabetical and non-space characters."> */
    return `${s(name)} moet letters of spaties bevatten.`
    /* </i18n> */
  },

  /**
   * The value have no symbol
   * @see {@link https://formkit.com/essentials/validation#contains_symbol}
   */
  contains_symbol({ name }) {
    /* <i18n case="Shown when the user-provided value contains only alphanumeric and space characters."> */
    return `${s(name)} moet een symbool bevatten.`
    /* </i18n> */
  },

  /**
   * The value have no uppercase
   * @see {@link https://formkit.com/essentials/validation#contains_uppercase}
   */
  contains_uppercase({ name }) {
    /* <i18n case="Shown when the user-provided value contains only non-alphabetical-uppercase characters."> */
    return `${s(name)} moet hoofdletters bevatten.`
    /* </i18n> */
  },

  /**
   * The value have no lowercase
   * @see {@link https://formkit.com/essentials/validation#contains_lowercase}
   */
  contains_lowercase({ name }) {
    /* <i18n case="Shown when the user-provided value contains only non-alphabetical-lowercase characters."> */
    return `${s(name)} moet kleine letters bevatten.`
    /* </i18n> */
  },

  /**
   *  The value have no numeric
   * @see {@link https://formkit.com/essentials/validation#contains_numeric}
   */
  contains_numeric({ name }) {
    /* <i18n case="Shown when the user-provided value have no numeric."> */
    return `${s(name)} moet cijfers bevatten.`
    /* </i18n> */
  },

  /**
   * The value is not symbol
   * @see {@link https://formkit.com/essentials/validation#symbol}
   */
  symbol({ name }) {
    /* <i18n case="Shown when the user-provided value contains alphanumeric and space characters."> */
    return `${s(name)} moet een symbool zijn.`
    /* </i18n> */
  },

  /**
   * The value is not uppercase
   * @see {@link https://formkit.com/essentials/validation#uppercase}
   */
  uppercase({ name }) {
    /* <i18n case="Shown when the user-provided value contains non-alphabetical-uppercase characters."> */
    return `${s(name)} mag alleen hoofdletters bevatten.`
    /* </i18n> */
  },

  /**
   * The value is not lowercase
   * @see {@link https://formkit.com/essentials/validation#lowercase}
   */
  lowercase({ name }) {
    /* <i18n case="Shown when the user-provided value contains non-alphabetical-lowercase characters."> */
    return `${s(name)} mag alleen kleine letters bevatten.`
    /* </i18n> */
  },

  /**
   * The date is not before
   * @see {@link https://formkit.com/essentials/validation#date-before}
   */
  date_before({ name, args }) {
    if (Array.isArray(args) && args.length) {
      /* <i18n case="Shown when the user-provided date is not before the date supplied to the rule."> */
      return `${s(name)} moet vóór ${date(args[0])} vallen.`
      /* </i18n> */
    }
    /* <i18n case="Shown when the user-provided date is not before today's date, since no date was supplied to the rule."> */
    return `${s(name)} moet in het verleden liggen.`
    /* </i18n> */
  },

  /**
   * The value is not between two numbers
   * @see {@link https://formkit.com/essentials/validation#between}
   */
  between({ name, args }) {
    if (isNaN(args[0]) || isNaN(args[1])) {
      /* <i18n case="Shown when any of the arguments supplied to the rule were not a number."> */
      return `Dit veld is onjuist geconfigureerd en kan niet worden verzonden.`
      /* </i18n> */
    }
    const [a, b] = order(args[0], args[1])
    /* <i18n case="Shown when the user-provided value is not between two numbers."> */
    return `${s(name)} moet tussen ${a} en ${b} liggen.`
    /* </i18n> */
  },

  /**
   * The confirmation field does not match
   * @see {@link https://formkit.com/essentials/validation#confirm}
   */
  confirm({ name }) {
    /* <i18n case="Shown when the user-provided value does not equal the value of the matched input."> */
    return `${s(name)} komt niet overeen.`
    /* </i18n> */
  },

  /**
   * The value is not a valid date
   * @see {@link https://formkit.com/essentials/validation#date-format}
   */
  date_format({ name, args }) {
    if (Array.isArray(args) && args.length) {
      /* <i18n case="Shown when the user-provided date does not satisfy the date format supplied to the rule."> */
      return `${s(name)} is geen geldige datum, gebruik de notatie ${args[0]}`
      /* </i18n> */
    }
    /* <i18n case="Shown when no date argument was supplied to the rule."> */
    return 'Dit veld is onjuist geconfigureerd en kan niet worden verzonden'
    /* </i18n> */
  },

  /**
   * Is not within expected date range
   * @see {@link https://formkit.com/essentials/validation#date-between}
   */
  date_between({ name, args }) {
    /* <i18n case="Shown when the user-provided date is not between the start and end dates supplied to the rule. "> */
    return `${s(name)} moet tussen ${date(args[0])} en ${date(args[1])} liggen`
    /* </i18n> */
  },

  /**
   * Shown when the user-provided value is not a valid email address.
   * @see {@link https://formkit.com/essentials/validation#email}
   */
  email: 'Vul een geldig e-mailadres in.',

  /**
   * Does not end with the specified value
   * @see {@link https://formkit.com/essentials/validation#ends-with}
   */
  ends_with({ name, args }) {
    /* <i18n case="Shown when the user-provided value does not end with the substring supplied to the rule."> */
    return `${s(name)} eindigt niet met ${list(args)}.`
    /* </i18n> */
  },

  /**
   * Is not an allowed value
   * @see {@link https://formkit.com/essentials/validation#is}
   */
  is({ name }) {
    /* <i18n case="Shown when the user-provided value is not one of the values supplied to the rule."> */
    return `${s(name)} is geen toegestane waarde.`
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
      return `${s(name)} moet minimaal één teken zijn.`
      /* </i18n> */
    }
    if (min == 0 && max) {
      /* <i18n case="Shown when first argument supplied to the rule is 0, and the user-provided value is longer than the max (the 2nd argument) supplied to the rule."> */
      return `${s(name)} mag maximaal ${max} tekens lang zijn.`
      /* </i18n> */
    }
    if (min === max) {
      /* <i18n case="Shown when first and second argument supplied to the rule are the same, and the user-provided value is not any of the arguments supplied to the rule."> */
      return `${s(name)} moet ${max} tekens lang zijn.`
      /* </i18n> */
    }
    if (min && max === Infinity) {
      /* <i18n case="Shown when the length of the user-provided value is less than the minimum supplied to the rule and there is no maximum supplied to the rule."> */
      return `${s(name)} moet minimaal ${min} tekens lang zijn.`
      /* </i18n> */
    }
    /* <i18n case="Shown when the length of the user-provided value is between the two lengths supplied to the rule."> */
    return `${s(name)} moet tussen de ${min} en ${max} tekens zijn.`
    /* </i18n> */
  },

  /**
   * Value is not a match
   * @see {@link https://formkit.com/essentials/validation#matches}
   */
  matches({ name }) {
    /* <i18n case="Shown when the user-provided value does not match any of the values or RegExp patterns supplied to the rule. "> */
    return `${s(name)} is geen toegestane waarde.`
    /* </i18n> */
  },

  /**
   * Exceeds maximum allowed value
   * @see {@link https://formkit.com/essentials/validation#max}
   */
  max({ name, node: { value }, args }) {
    if (Array.isArray(value)) {
      /* <i18n case="Shown when the length of the array of user-provided values is longer than the max supplied to the rule."> */
      return `Mag niet meer dan ${args[0]} ${name} hebben.`
      /* </i18n> */
    }
    /* <i18n case="Shown when the user-provided value is greater than the maximum number supplied to the rule."> */
    return `${s(name)} moet kleiner zijn dan of gelijk zijn aan ${args[0]}.`
    /* </i18n> */
  },

  /**
   * The (field-level) value does not match specified mime type
   * @see {@link https://formkit.com/essentials/validation#mime}
   */
  mime({ name, args }) {
    if (!args[0]) {
      /* <i18n case="Shown when no file formats were supplied to the rule."> */
      return 'Geen bestandsformaten toegestaan.'
      /* </i18n> */
    }
    /* <i18n case="Shown when the mime type of user-provided file does not match any mime types supplied to the rule."> */
    return `${s(name)} moet van het type: ${args[0]} zijn`
    /* </i18n> */
  },

  /**
   * Does not fulfill minimum allowed value
   * @see {@link https://formkit.com/essentials/validation#min}
   */
  min({ name, node: { value }, args }) {
    if (Array.isArray(value)) {
      /* <i18n case="Shown when the length of the array of user-provided values is shorter than the min supplied to the rule."> */
      return `Mag niet minder dan ${args[0]} ${name} hebben.`
      /* </i18n> */
    }
    /* <i18n case="Shown when the user-provided value is less than the minimum number supplied to the rule."> */
    return `${s(name)} moet minimaal ${args[0]} zijn.`
    /* </i18n> */
  },

  /**
   * Is not an allowed value
   * @see {@link https://formkit.com/essentials/validation#not}
   */
  not({ name, node: { value } }) {
    /* <i18n case="Shown when the user-provided value matches one of the values supplied to (and thus disallowed by) the rule."> */
    return `"${value}" is geen toegestane ${name}.`
    /* </i18n> */
  },

  /**
   *  Is not a number
   * @see {@link https://formkit.com/essentials/validation#number}
   */
  number({ name }) {
    /* <i18n case="Shown when the user-provided value is not a number."> */
    return `${s(name)} moet een getal zijn.`
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
    return `${labels.join(' of ')} is vereist.`
    /* </i18n> */
  },

  /**
   * Required field.
   * @see {@link https://formkit.com/essentials/validation#required}
   */
  required({ name }) {
    /* <i18n case="Shown when a user does not provide a value to a required input."> */
    return `${s(name)} is verplicht.`
    /* </i18n> */
  },

  /**
   * Does not start with specified value
   * @see {@link https://formkit.com/essentials/validation#starts-with}
   */
  starts_with({ name, args }) {
    /* <i18n case="Shown when the user-provided value does not start with the substring supplied to the rule."> */
    return `${s(name)} begint niet met ${list(args)}.`
    /* </i18n> */
  },

  /**
   * Is not a url
   * @see {@link https://formkit.com/essentials/validation#url}
   */
  url() {
    /* <i18n case="Shown when the user-provided value is not a valid url."> */
    return `Voer een geldige URL in.`
    /* </i18n> */
  },
  /**
   * Shown when the date is invalid.
   */
  invalidDate: 'De geselecteerde datum is ongeldig.',
}

export const nl = { ui, validation }
