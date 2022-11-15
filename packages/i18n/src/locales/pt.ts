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
   * Shown on buttons for adding new items.
   */
  add: 'Adicionar',
  /**
   * Shown when a button to remove items is visible.
   */
  remove: 'Remover',
  /**
   * Shown when there are multiple items to remove at the same time.
   */
  removeAll: 'Deletar tudo',
  /**
   * Shown when all fields are not filled out correctly.
   */
  incomplete: 'Desculpe, nem todos os campos foram preenchidos corretamente.',
  /**
   * Shown in a button inside a form to submit the form.
   */
  submit: 'Enviar',
  /**
   * Shown when no files are selected.
   */
  noFiles: 'Nenhum arquivo',
  /**
   * Shown on buttons that move fields up in a list.
   */
  moveUp: 'Mova-se para cima',
  /**
   * Shown on buttons that move fields down in a list.
   */
  moveDown: 'Mova-se para baixo',
  /**
   * Shown when something is actively loading.
   */
  isLoading: 'Carregando...',
  /**
   * Shown when there is more to load.
   */
  loadMore: 'Carregue mais',
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
    return `Por favor aceite o ${name}.`
    /* </i18n> */
  },

  /**
   * The date is not after
   * @see {@link https://docs.formkit.com/essentials/validation#date-after}
   */
  date_after({ name, args }) {
    if (Array.isArray(args) && args.length) {
      /* <i18n case="Shown when the user-provided date is not after the date supplied to the rule."> */
      return `${s(name)} deve ser posterior a ${date(args[0])}.`
      /* </i18n> */
    }
    /* <i18n case="Shown when the user-provided date is not after today's date, since no date was supplied to the rule."> */
    return `${s(name)} deve ser no futuro.`
    /* </i18n> */
  },

  /**
   * The value is not a letter.
   * @see {@link https://docs.formkit.com/essentials/validation#alpha}
   */
  alpha({ name }) {
    /* <i18n case="Shown when the user-provided value contains non-alphabetical characters."> */
    return `${s(name)} só pode conter caracteres do alfabeto.`
    /* </i18n> */
  },

  /**
   * The value is not alphanumeric
   * @see {@link https://docs.formkit.com/essentials/validation#alphanumeric}
   */
  alphanumeric({ name }) {
    /* <i18n case="Shown when the user-provided value contains non-alphanumeric characters."> */
    return `${s(name)} só pode ter letras e números.`
    /* </i18n> */
  },

  /**
   * The value is not letter and/or spaces
   * @see {@link https://docs.formkit.com/essentials/validation#alpha-spaces}
   */
  alpha_spaces({ name }) {
    /* <i18n case="Shown when the user-provided value contains non-alphabetical and non-space characters."> */
    return `${s(name)} só podem conter letras e espaços.`
    /* </i18n> */
  },

  /**
   * The date is not before
   * @see {@link https://docs.formkit.com/essentials/validation#date-before}
   */
  date_before({ name, args }) {
    if (Array.isArray(args) && args.length) {
      /* <i18n case="Shown when the user-provided date is not before the date supplied to the rule."> */
      return `${s(name)} deve ser anterior a ${date(args[0])}.`
      /* </i18n> */
    }
    /* <i18n case="Shown when the user-provided date is not before today's date, since no date was supplied to the rule."> */
    return `${s(name)} deve ser anterior a data atual.`
    /* </i18n> */
  },

  /**
   * The value is not between two numbers
   * @see {@link https://docs.formkit.com/essentials/validation#between}
   */
  between({ name, args }) {
    if (isNaN(args[0]) || isNaN(args[1])) {
      /* <i18n case="Shown when any of the arguments supplied to the rule were not a number."> */
      return `O campo foi configurado incorretamente e não pode ser enviado.`
      /* </i18n> */
    }
    /* <i18n case="Shown when the user-provided value is not between two numbers."> */
    return `${s(name)} deve estar entre ${args[0]} e ${args[1]}.`
    /* </i18n> */
  },

  /**
   * The confirmation field does not match
   * @see {@link https://docs.formkit.com/essentials/validation#confirm}
   */
  confirm({ name }) {
    /* <i18n case="Shown when the user-provided value does not equal the value of the matched input."> */
    return `${s(name)} não confere.`
    /* </i18n> */
  },

  /**
   * The value is not a valid date
   * @see {@link https://docs.formkit.com/essentials/validation#date-format}
   */
  date_format({ name, args }) {
    if (Array.isArray(args) && args.length) {
      /* <i18n case="Shown when the user-provided date does not satisfy the date format supplied to the rule."> */
      return `${s(name)} não é uma data válida, por favor use o formato ${
        args[0]
      }`
      /* </i18n> */
    }
    /* <i18n case="Shown when no date argument was supplied to the rule."> */
    return 'O campo foi configurado incorretamente e não pode ser enviado.'
    /* </i18n> */
  },

  /**
   * Is not within expected date range
   * @see {@link https://docs.formkit.com/essentials/validation#date-between}
   */
  date_between({ name, args }) {
    /* <i18n case="Shown when the user-provided date is not between the start and end dates supplied to the rule. "> */
    return `${s(name)} deve ser entre ${date(args[0])} e ${date(args[1])}`
    /* </i18n> */
  },

  /**
   * Shown when the user-provided value is not a valid email address.
   * @see {@link https://docs.formkit.com/essentials/validation#email}
   */
  email: 'Por favor informe um e-mail válido.',

  /**
   * Does not end with the specified value
   * @see {@link https://docs.formkit.com/essentials/validation#ends-with}
   */
  ends_with({ name, args }) {
    /* <i18n case="Shown when the user-provided value does not end with the substring supplied to the rule."> */
    return `${s(name)} não termina com ${list(args)}.`
    /* </i18n> */
  },

  /**
   * Is not an allowed value
   * @see {@link https://docs.formkit.com/essentials/validation#is}
   */
  is({ name }) {
    /* <i18n case="Shown when the user-provided value is not one of the values supplied to the rule."> */
    return `${s(name)} não é um valor permitido.`
    /* </i18n> */
  },

  /**
   * Does not match specified length
   * @see {@link https://docs.formkit.com/essentials/validation#length}
   */
  length({ name, args: [first = 0, second = Infinity] }) {
    const min = first <= second ? first : second
    const max = second >= first ? second : first
    if (min == 1 && max === Infinity) {
      /* <i18n case="Shown when the length of the user-provided value is not at least one character."> */
      return `${s(name)} deve ter ao menos um caractere.`
      /* </i18n> */
    }
    if (min == 0 && max) {
      /* <i18n case="Shown when first argument supplied to the rule is 0, and the user-provided value is longer than the max (the 2nd argument) supplied to the rule."> */
      return `${s(name)} não pode ter mais que ${max} caracteres.`
      /* </i18n> */
    }
    if (min === max) {
      /* <i18n case="Shown when first and second argument supplied to the rule are the same, and the user-provided value is not any of the arguments supplied to the rule."> */
      return `${s(name)} deve ter ${max} caracteres.`
      /* </i18n> */
    }
    if (min && max === Infinity) {
      /* <i18n case="Shown when the length of the user-provided value is less than the minimum supplied to the rule and there is no maximum supplied to the rule."> */
      return `${s(name)} deve ter no mínimo ${min} caracteres.`
      /* </i18n> */
    }
    /* <i18n case="Shown when the length of the user-provided value is between the two lengths supplied to the rule."> */
    return `${s(name)} deve ter entre ${min} e ${max} caracteres.`
    /* </i18n> */
  },

  /**
   * Value is not a match
   * @see {@link https://docs.formkit.com/essentials/validation#matches}
   */
  matches({ name }) {
    /* <i18n case="Shown when the user-provided value does not match any of the values or RegExp patterns supplied to the rule. "> */
    return `${s(name)} não é um valor permitido.`
    /* </i18n> */
  },

  /**
   * Exceeds maximum allowed value
   * @see {@link https://docs.formkit.com/essentials/validation#max}
   */
  max({ name, node: { value }, args }) {
    if (Array.isArray(value)) {
      /* <i18n case="Shown when the length of the array of user-provided values is longer than the max supplied to the rule."> */
      return `Não pode ter mais que ${args[0]} ${name}.`
      /* </i18n> */
    }
    /* <i18n case="Shown when the user-provided value is greater than the maximum number supplied to the rule."> */
    return `${s(name)} deve ser igual ou menor que ${args[0]}.`
    /* </i18n> */
  },

  /**
   * The (field-level) value does not match specified mime type
   * @see {@link https://docs.formkit.com/essentials/validation#mime}
   */
  mime({ name, args }) {
    if (!args[0]) {
      /* <i18n case="Shown when no file formats were supplied to the rule."> */
      return 'Nenhum formato de arquivo permitido.'
      /* </i18n> */
    }
    /* <i18n case="Shown when the mime type of user-provided file does not match any mime types supplied to the rule."> */
    return `${s(name)} deve ser do tipo: ${args[0]}`
    /* </i18n> */
  },

  /**
   * Does not fulfill minimum allowed value
   * @see {@link https://docs.formkit.com/essentials/validation#min}
   */
  min({ name, node: { value }, args }) {
    if (Array.isArray(value)) {
      /* <i18n case="Shown when the length of the array of user-provided values is shorter than the min supplied to the rule."> */
      return `Não pode ter menos que ${args[0]} ${name}.`
      /* </i18n> */
    }
    /* <i18n case="Shown when the user-provided value is less than the minimum number supplied to the rule."> */
    return `${s(name)} deve ter pelo menos ${args[0]}.`
    /* </i18n> */
  },

  /**
   * Is not an allowed value
   * @see {@link https://docs.formkit.com/essentials/validation#not}
   */
  not({ name, node: { value } }) {
    /* <i18n case="Shown when the user-provided value matches one of the values supplied to (and thus disallowed by) the rule."> */
    return `“${value}” não permite ${name}.`
    /* </i18n> */
  },

  /**
   *  Is not a number
   * @see {@link https://docs.formkit.com/essentials/validation#number}
   */
  number({ name }) {
    /* <i18n case="Shown when the user-provided value is not a number."> */
    return `${s(name)} deve ser um número.`
    /* </i18n> */
  },

  /**
   * Required field.
   * @see {@link https://docs.formkit.com/essentials/validation#required}
   */
  required({ name }) {
    /* <i18n case="Shown when a user does not provide a value to a required input."> */
    return `${s(name)} é obrigatório.`
    /* </i18n> */
  },

  /**
   * Does not start with specified value
   * @see {@link https://docs.formkit.com/essentials/validation#starts-with}
   */
  starts_with({ name, args }) {
    /* <i18n case="Shown when the user-provided value does not start with the substring supplied to the rule."> */
    return `${s(name)} não começa com ${list(args)}.`
    /* </i18n> */
  },

  /**
   * Is not a url
   * @see {@link https://docs.formkit.com/essentials/validation#url}
   */
  url() {
    /* <i18n case="Shown when the user-provided value is not a valid url."> */
    return `Por favor informe um url válido.`
    /* </i18n> */
  },
}
