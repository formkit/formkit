import type { FormKitValidationMessages, FormKitValidationMessage } from '@formkit/validation';
import { createMessageName } from '@formkit/validation';

/**
 * Here we can import additional helper functions to assist in formatting our
 * language. Feel free to add additional helper methods to libs/formats if it
 * assists in creating good validation messages for your locale.
 */
import { sentence as s, list, date, order } from '../formatters';
import type { FormKitLocaleMessages } from '../i18n';
/**
 * Shown on buttons for adding new items.
 */
export const add = 'Tilføj';
/**
 * Shown when a button to remove items is visible.
 */
export const remove = 'Fjern';
/**
 * Shown when there are multiple items to remove at the same time.
 */
export const removeAll = 'Fjern alle';
/**
 * Shown when all fields are not filled out correctly.
 */
export const incomplete = 'Alle felter er ikke korrekt udfyldt.';
/**
 * Shown in a button inside a form to submit the form.
 */
export const submit = 'Send';
/**
 * Shown when no files are selected.
 */
export const noFiles = 'Ingen filer valgt';
/**
 * Shown on buttons that move fields up in a list.
 */
export const moveUp = 'Flyt op';
/**
 * Shown on buttons that move fields down in a list.
 */
export const moveDown = 'Flyt ned';
/**
 * Shown when something is actively loading.
 */
export const isLoading = 'Indlæser...';
/**
 * Shown when there is more to load.
 */
export const loadMore = 'Indlæs mere';
/**
 * Shown on buttons that navigate state forward
 */
export const next = 'Næste';
/**
 * Shown on buttons that navigate state backward
 */
export const prev = 'Forrige';
/**
 * Shown when adding all values.
 */
export const addAllValues = 'Tilføj alle værdier';
/**
 * Shown when adding selected values.
 */
export const addSelectedValues = 'Tilføj valgte værdier';
/**
 * Shown when removing all values.
 */
export const removeAllValues = 'Fjern alle værdier';
/**
 * Shown when removing selected values.
 */
export const removeSelectedValues = 'Fjern valgte værdier';
/**
 * Shown when there is a date to choose.
 */
export const chooseDate = 'Vælg dato';
/**
 * Shown when there is a date to change.
 */
export const changeDate = 'Skift dato';
/**
 * Shown when there is something to close
 */
export const close = 'Luk';
/**
 * Shown when there is something to open.
 */
export const open = 'Åbn';
/**
 * The value is not an accepted value.
 * @see {@link https://formkit.com/essentials/validation#accepted}
 */
export const accepted: FormKitValidationMessage = function ({
  name
}) {
  /* <i18n case="Shown when the user-provided value is not a valid 'accepted' value."> */
  return `Accepter venligst ${name}.`;
  /* </i18n> */
};
/**
 * The date is not after
 * @see {@link https://formkit.com/essentials/validation#date-after}
 */
export const date_after: FormKitValidationMessage = function ({
  name,
  args
}) {
  if (Array.isArray(args) && args.length) {
    /* <i18n case="Shown when the user-provided date is not after the date supplied to the rule."> */
    return `${s(name)} skal være senere end ${date(args[0])}.`;
    /* </i18n> */
  }
  /* <i18n case="Shown when the user-provided date is not after today's date, since no date was supplied to the rule."> */
  return `${s(name)} skal være i fremtiden.`;
  /* </i18n> */
};
/**
 * The value is not a letter.
 * @see {@link https://formkit.com/essentials/validation#alpha}
 */
export const alpha: FormKitValidationMessage = function ({
  name
}) {
  /* <i18n case="Shown when the user-provided value contains non-alphabetical characters."> */
  return `${s(name)} kan kun indeholde bogstaver.`;
  /* </i18n> */
};
/**
 * The value is not alphanumeric
 * @see {@link https://formkit.com/essentials/validation#alphanumeric}
 */
export const alphanumeric: FormKitValidationMessage = function ({
  name
}) {
  /* <i18n case="Shown when the user-provided value contains non-alphanumeric characters."> */
  return `${s(name)} kan kun indeholde bogstaver og tal.`;
  /* </i18n> */
};
/**
 * The value is not letter and/or spaces
 * @see {@link https://formkit.com/essentials/validation#alpha-spaces}
 */
export const alpha_spaces: FormKitValidationMessage = function ({
  name
}) {
  /* <i18n case="Shown when the user-provided value contains non-alphabetical and non-space characters."> */
  return `${s(name)} kan kun indeholde bogstaver og mellemrum.`;
  /* </i18n> */
};
/**
 * The value have no letter.
 * @see {@link https://formkit.com/essentials/validation#contains_alpha}
 */
export const contains_alpha: FormKitValidationMessage = function ({
  name
}) {
  /* <i18n case="Shown when the user-provided value contains only non-alphabetical characters."> */
  return `${s(name)} skal indeholde alfabetiske tegn.`;
  /* </i18n> */
};
/**
 * The value have no alphanumeric
 * @see {@link https://formkit.com/essentials/validation#contains_alphanumeric}
 */
export const contains_alphanumeric: FormKitValidationMessage = function ({
  name
}) {
  /* <i18n case="Shown when the user-provided value contains only non-alphanumeric characters."> */
  return `${s(name)} skal indeholde bogstaver eller tal.`;
  /* </i18n> */
};
/**
 * The value have no letter and/or spaces
 * @see {@link https://formkit.com/essentials/validation#contains_alpha-spaces}
 */
export const contains_alpha_spaces: FormKitValidationMessage = function ({
  name
}) {
  /* <i18n case="Shown when the user-provided value contains only non-alphabetical and non-space characters."> */
  return `${s(name)} skal indeholde bogstaver eller mellemrum.`;
  /* </i18n> */
};
/**
 * The value have no symbol
 * @see {@link https://formkit.com/essentials/validation#contains_symbol}
 */
export const contains_symbol: FormKitValidationMessage = function ({
  name
}) {
  /* <i18n case="Shown when the user-provided value contains only alphanumeric and space characters."> */
  return `${s(name)} skal indeholde symbol.`;
  /* </i18n> */
};
/**
 * The value have no uppercase
 * @see {@link https://formkit.com/essentials/validation#contains_uppercase}
 */
export const contains_uppercase: FormKitValidationMessage = function ({
  name
}) {
  /* <i18n case="Shown when the user-provided value contains only non-alphabetical-uppercase characters."> */
  return `${s(name)} skal indeholde store bogstaver.`;
  /* </i18n> */
};
/**
 * The value have no lowercase
 * @see {@link https://formkit.com/essentials/validation#contains_lowercase}
 */
export const contains_lowercase: FormKitValidationMessage = function ({
  name
}) {
  /* <i18n case="Shown when the user-provided value contains only non-alphabetical-lowercase characters."> */
  return `${s(name)} skal indeholde små bogstaver.`;
  /* </i18n> */
};
/**
 *  The value have no numeric
 * @see {@link https://formkit.com/essentials/validation#contains_numeric}
 */
export const contains_numeric: FormKitValidationMessage = function ({
  name
}) {
  /* <i18n case="Shown when the user-provided value have no numeric."> */
  return `${s(name)} skal indeholde tal.`;
  /* </i18n> */
};
/**
 * The value is not symbol
 * @see {@link https://formkit.com/essentials/validation#symbol}
 */
export const symbol: FormKitValidationMessage = function ({
  name
}) {
  /* <i18n case="Shown when the user-provided value contains alphanumeric and space characters."> */
  return `${s(name)} skal være et symbol.`;
  /* </i18n> */
};
/**
 * The value is not uppercase
 * @see {@link https://formkit.com/essentials/validation#uppercase}
 */
export const uppercase: FormKitValidationMessage = function ({
  name
}) {
  /* <i18n case="Shown when the user-provided value contains non-alphabetical-uppercase characters."> */
  return `${s(name)} kan kun indeholde store bogstaver.`;
  /* </i18n> */
};
/**
 * The value is not lowercase
 * @see {@link https://formkit.com/essentials/validation#lowercase}
 */
export const lowercase: FormKitValidationMessage = function ({
  name
}) {
  /* <i18n case="Shown when the user-provided value contains non-alphabetical-lowercase characters."> */
  return `${s(name)} kan kun indeholde små bogstaver.`;
  /* </i18n> */
};
/**
 * The date is not before
 * @see {@link https://formkit.com/essentials/validation#date-before}
 */
export const date_before: FormKitValidationMessage = function ({
  name,
  args
}) {
  if (Array.isArray(args) && args.length) {
    /* <i18n case="Shown when the user-provided date is not before the date supplied to the rule."> */
    return `${s(name)} skal være før ${date(args[0])}.`;
    /* </i18n> */
  }
  /* <i18n case="Shown when the user-provided date is not before today's date, since no date was supplied to the rule."> */
  return `${s(name)} skal være før i dag.`;
  /* </i18n> */
};
/**
 * The value is not between two numbers
 * @see {@link https://formkit.com/essentials/validation#between}
 */
export const between: FormKitValidationMessage = function ({
  name,
  args
}) {
  if (isNaN(args[0]) || isNaN(args[1])) {
    /* <i18n case="Shown when any of the arguments supplied to the rule were not a number."> */
    return `Dette felt er ikke konfigureret korrekt og kan derfor ikke blive sendt.`;
    /* </i18n> */
  }
  const [a, b] = order(args[0], args[1]);
  /* <i18n case="Shown when the user-provided value is not between two numbers."> */
  return `${s(name)} skal være mellem ${a} og ${b}.`;
  /* </i18n> */
};
/**
 * The confirmation field does not match
 * @see {@link https://formkit.com/essentials/validation#confirm}
 */
export const confirm: FormKitValidationMessage = function ({
  name
}) {
  /* <i18n case="Shown when the user-provided value does not equal the value of the matched input."> */
  return `${s(name)} matcher ikke.`;
  /* </i18n> */
};
/**
 * The value is not a valid date
 * @see {@link https://formkit.com/essentials/validation#date-format}
 */
export const date_format: FormKitValidationMessage = function ({
  name,
  args
}) {
  if (Array.isArray(args) && args.length) {
    /* <i18n case="Shown when the user-provided date does not satisfy the date format supplied to the rule."> */
    return `${s(name)} er ikke gyldig, brug venligst formatet ${args[0]}`;
    /* </i18n> */
  }
  /* <i18n case="Shown when no date argument was supplied to the rule."> */
  return 'Dette felt er ikke konfigureret korrekt og kan derfor ikke blive sendt.';
  /* </i18n> */
};
/**
 * Is not within expected date range
 * @see {@link https://formkit.com/essentials/validation#date-between}
 */
export const date_between: FormKitValidationMessage = function ({
  name,
  args
}) {
  /* <i18n case="Shown when the user-provided date is not between the start and end dates supplied to the rule. "> */
  return `${s(name)} skal være mellem ${date(args[0])} og ${date(args[1])}`;
  /* </i18n> */
};
/**
 * Shown when the user-provided value is not a valid email address.
 * @see {@link https://formkit.com/essentials/validation#email}
 */
export const email = 'Indtast venligst en gyldig email-adresse.';
/**
 * Does not end with the specified value
 * @see {@link https://formkit.com/essentials/validation#ends-with}
 */
export const ends_with: FormKitValidationMessage = function ({
  name,
  args
}) {
  /* <i18n case="Shown when the user-provided value does not end with the substring supplied to the rule."> */
  return `${s(name)} slutter ikke med ${list(args)}.`;
  /* </i18n> */
};
/**
 * Is not an allowed value
 * @see {@link https://formkit.com/essentials/validation#is}
 */
export const is: FormKitValidationMessage = function ({
  name
}) {
  /* <i18n case="Shown when the user-provided value is not one of the values supplied to the rule."> */
  return `${s(name)} er ikke en gyldig værdi.`;
  /* </i18n> */
};
/**
 * Does not match specified length
 * @see {@link https://formkit.com/essentials/validation#length}
 */
export const length: FormKitValidationMessage = function ({
  name,
  args: [first = 0, second = Infinity]
}) {
  const min = Number(first) <= Number(second) ? first : second;
  const max = Number(second) >= Number(first) ? second : first;
  if (min == 1 && max === Infinity) {
    /* <i18n case="Shown when the length of the user-provided value is not at least one character."> */
    return `${s(name)} skal være på mindst ét tegn.`;
    /* </i18n> */
  }
  if (min == 0 && max) {
    /* <i18n case="Shown when first argument supplied to the rule is 0, and the user-provided value is longer than the max (the 2nd argument) supplied to the rule."> */
    return `${s(name)} skal være på højst ${max} tegn.`;
    /* </i18n> */
  }
  if (min === max) {
    /* <i18n case="Shown when first and second argument supplied to the rule are the same, and the user-provided value is not any of the arguments supplied to the rule."> */
    return `${s(name)} skal være ${max} tegn lange.`;
    /* </i18n> */
  }
  if (min && max === Infinity) {
    /* <i18n case="Shown when the length of the user-provided value is less than the minimum supplied to the rule and there is no maximum supplied to the rule."> */
    return `${s(name)} skal være på mindst ${min} tegn.`;
    /* </i18n> */
  }
  /* <i18n case="Shown when the length of the user-provided value is between the two lengths supplied to the rule."> */
  return `${s(name)} skal være på mindst ${min} og højst ${max} tegn.`;
  /* </i18n> */
};
/**
 * Value is not a match
 * @see {@link https://formkit.com/essentials/validation#matches}
 */
export const matches: FormKitValidationMessage = function ({
  name
}) {
  /* <i18n case="Shown when the user-provided value does not match any of the values or RegExp patterns supplied to the rule. "> */
  return `${s(name)} er ikke en gyldig værdi.`;
  /* </i18n> */
};
/**
 * Exceeds maximum allowed value
 * @see {@link https://formkit.com/essentials/validation#max}
 */
export const max: FormKitValidationMessage = function ({
  name,
  node: {
    value
  },
  args
}) {
  if (Array.isArray(value)) {
    /* <i18n case="Shown when the length of the array of user-provided values is longer than the max supplied to the rule."> */
    return `Kan ikke have flere end ${args[0]} ${name}.`;
    /* </i18n> */
  }
  /* <i18n case="Shown when the user-provided value is greater than the maximum number supplied to the rule."> */
  return `${s(name)} skal være mindre eller lig med ${args[0]}.`;
  /* </i18n> */
};
/**
 * The (field-level) value does not match specified mime type
 * @see {@link https://formkit.com/essentials/validation#mime}
 */
export const mime: FormKitValidationMessage = function ({
  name,
  args
}) {
  if (!args[0]) {
    /* <i18n case="Shown when no file formats were supplied to the rule."> */
    return 'Ingen filformater tilladt.';
    /* </i18n> */
  }
  /* <i18n case="Shown when the mime type of user-provided file does not match any mime types supplied to the rule."> */
  return `${s(name)} skal være af filtypen: ${args[0]}`;
  /* </i18n> */
};
/**
 * Does not fulfill minimum allowed value
 * @see {@link https://formkit.com/essentials/validation#min}
 */
export const min: FormKitValidationMessage = function ({
  name,
  node: {
    value
  },
  args
}) {
  if (Array.isArray(value)) {
    /* <i18n case="Shown when the length of the array of user-provided values is shorter than the min supplied to the rule."> */
    return `Kan ikke have mindre end ${args[0]} ${name}.`;
    /* </i18n> */
  }
  /* <i18n case="Shown when the user-provided value is less than the minimum number supplied to the rule."> */
  return `${s(name)} skal være mindst ${args[0]}.`;
  /* </i18n> */
};
/**
 * Is not an allowed value
 * @see {@link https://formkit.com/essentials/validation#not}
 */
export const not: FormKitValidationMessage = function ({
  name,
  node: {
    value
  }
}) {
  /* <i18n case="Shown when the user-provided value matches one of the values supplied to (and thus disallowed by) the rule."> */
  return `“${value}” er ikke en tilladt ${name}.`;
  /* </i18n> */
};
/**
 *  Is not a number
 * @see {@link https://formkit.com/essentials/validation#number}
 */
export const number: FormKitValidationMessage = function ({
  name
}) {
  /* <i18n case="Shown when the user-provided value is not a number."> */
  return `${s(name)} skal være et tal.`;
  /* </i18n> */
};
/**
 * Require one field.
 * @see {@link https://formkit.com/essentials/validation#require-one}
 */
export const require_one: FormKitValidationMessage = function ({
  name,
  node,
  args: inputNames
}) {
  const labels = inputNames.map(name => {
    const dependentNode = node.at(name);
    if (dependentNode) {
      return createMessageName(dependentNode);
    }
    return false;
  }).filter(name => !!name);
  labels.unshift(name);
  /* <i18n case="Shown when the user-provided has not provided a value for at least one of the required fields."> */
  return `${labels.join(' eller ')} er påkrævet.`;
  /* </i18n> */
};
/**
 * Required field.
 * @see {@link https://formkit.com/essentials/validation#required}
 */
export const required: FormKitValidationMessage = function ({
  name
}) {
  /* <i18n case="Shown when a user does not provide a value to a required input."> */
  return `${s(name)} er påkrævet.`;
  /* </i18n> */
};
/**
 * Does not start with specified value
 * @see {@link https://formkit.com/essentials/validation#starts-with}
 */
export const starts_with: FormKitValidationMessage = function ({
  name,
  args
}) {
  /* <i18n case="Shown when the user-provided value does not start with the substring supplied to the rule."> */
  return `${s(name)} starter ikke med ${list(args)}.`;
  /* </i18n> */
};
/**
 * Is not a url
 * @see {@link https://formkit.com/essentials/validation#url}
 */
export const url: FormKitValidationMessage = function () {
  /* <i18n case="Shown when the user-provided value is not a valid url."> */
  return `Indtast en gyldig URL.`;
  /* </i18n> */
};
/**
 * Shown when the date is invalid.
 */
export const invalidDate = 'Den valgte dato er ugyldig.';
/**
 * Standard language for interface features.
 * @public
 */
const ui: FormKitLocaleMessages = {
  add,
  remove,
  removeAll,
  incomplete,
  submit,
  noFiles,
  moveUp,
  moveDown,
  isLoading,
  loadMore,
  next,
  prev,
  addAllValues,
  addSelectedValues,
  removeAllValues,
  removeSelectedValues,
  chooseDate,
  changeDate,
  close,
  open
};

/**
 * These are all the possible strings that pertain to validation messages.
 * @public
 */
const validation: FormKitValidationMessages = {
  accepted,
  date_after,
  alpha,
  alphanumeric,
  alpha_spaces,
  contains_alpha,
  contains_alphanumeric,
  contains_alpha_spaces,
  contains_symbol,
  contains_uppercase,
  contains_lowercase,
  contains_numeric,
  symbol,
  uppercase,
  lowercase,
  date_before,
  between,
  confirm,
  date_format,
  date_between,
  email,
  ends_with,
  is,
  length,
  matches,
  max,
  mime,
  min,
  not,
  number,
  require_one,
  required,
  starts_with,
  url,
  invalidDate
};
export default {
  ui,
  validation
};