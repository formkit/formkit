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
export const add = 'Ekle';
/**
 * Shown when a button to remove items is visible.
 */
export const remove = 'Kaldır';
/**
 * Shown when there are multiple items to remove at the same time.
 */
export const removeAll = 'Hepsini kaldır';
/**
 * Shown when all fields are not filled out correctly.
 */
export const incomplete = 'Maalesef, tüm alanlar doğru doldurulmadı.';
/**
 * Shown in a button inside a form to submit the form.
 */
export const submit = 'Gönder';
/**
 * Shown when no files are selected.
 */
export const noFiles = 'Dosya yok';
/**
 * Shown on buttons that move fields up in a list.
 */
export const moveUp = 'Yukarı Taşı';
/**
 * Shown on buttons that move fields down in a list.
 */
export const moveDown = 'Aşağı taşı';
/**
 * Shown when something is actively loading.
 */
export const isLoading = 'Yükleniyor...';
/**
 * Shown when there is more to load.
 */
export const loadMore = 'Daha fazla yükle';
/**
 * Shown on buttons that navigate state forward
 */
export const next = 'Sonraki';
/**
 * Shown on buttons that navigate state backward
 */
export const prev = 'Önceki';
/**
 * Shown when adding all values.
 */
export const addAllValues = 'Tüm değerleri ekle';
/**
 * Shown when adding selected values.
 */
export const addSelectedValues = 'Seçili değerleri ekle';
/**
 * Shown when removing all values.
 */
export const removeAllValues = 'Tüm değerleri kaldır';
/**
 * Shown when removing selected values.
 */
export const removeSelectedValues = 'Seçili değerleri kaldır';
/**
 * Shown when there is a date to choose.
 */
export const chooseDate = 'Tarih seçin';
/**
 * Shown when there is a date to change.
 */
export const changeDate = 'Tarihi değiştir';
/**
 * Shown when there is something to close
 */
export const close = 'Kapat';
/**
 * Shown when there is something to open.
 */
export const open = 'Açık';
/**
 * The value is not an accepted value.
 * @see {@link https://formkit.com/essentials/validation#accepted}
 */
export const accepted: FormKitValidationMessage = function ({
  name
}) {
  /* <i18n case="Shown when the user-provided value is not a valid 'accepted' value."> */
  return `Lütfen ${name}'yi kabul edin.`;
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
    return `${s(name)} ${date(args[0])}'den sonra olmalıdır.`;
    /* </i18n> */
  }
  /* <i18n case="Shown when the user-provided date is not after today's date, since no date was supplied to the rule."> */
  return `${s(name)} gelecekte bir zaman olmalıdır.`;
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
  return `${s(name)} sadece alfabetik karakterler içerebilir.`;
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
  return `${s(name)} sadece alfabetik karakterler ve sayı içerebilir.`;
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
  return `${s(name)} yalnızca harf ve boşluk içerebilir.`;
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
  return `${s(name)} alfabetik karakterler içermelidir.`;
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
  return `${s(name)} harf veya rakamı içermelidir.`;
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
  return `${s(name)} harf veya boşluk içermelidir.`;
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
  return `${s(name)} sembol içermelidir.`;
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
  return `${s(name)} büyük harf içermelidir.`;
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
  return `${s(name)} küçük harf içermelidir.`;
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
  return `${s(name)} sayı içermelidir.`;
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
  return `${s(name)} bir sembol olmalıdır.`;
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
  return `${s(name)} yalnızca büyük harfler içerebilir.`;
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
  return `${s(name)} yalnızca küçük harfler içerebilir.`;
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
    return `${s(name)} ${date(args[0])} tarihinden önce olmalı.`;
    /* </i18n> */
  }
  /* <i18n case="Shown when the user-provided date is not before today's date, since no date was supplied to the rule."> */
  return `${s(name)} geçmişte olmalı.`;
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
    return `Alan yanlış yapılandırılmış ve gönderilemez.`;
    /* </i18n> */
  }
  const [a, b] = order(args[0], args[1]);
  /* <i18n case="Shown when the user-provided value is not between two numbers."> */
  return `${s(name)} ${a} ve ${b} aralığında olmalı.`;
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
  return `${s(name)} eşleşmiyor.`;
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
    return `${s(name)} geçerli bir tarih değil, lütfen ${args[0]} biçimini kullanın.`;
    /* </i18n> */
  }
  /* <i18n case="Shown when no date argument was supplied to the rule."> */
  return 'Alan yanlış yapılandırılmış ve gönderilemez.';
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
  return `${s(name)}, ${date(args[0])} ve ${date(args[1])} aralığında olmalı.`;
  /* </i18n> */
};
/**
 * Shown when the user-provided value is not a valid email address.
 * @see {@link https://formkit.com/essentials/validation#email}
 */
export const email = 'Lütfen geçerli bir e-mail adresi girin.';
/**
 * Does not end with the specified value
 * @see {@link https://formkit.com/essentials/validation#ends-with}
 */
export const ends_with: FormKitValidationMessage = function ({
  name,
  args
}) {
  /* <i18n case="Shown when the user-provided value does not end with the substring supplied to the rule."> */
  return `${s(name)} ${list(args)} ile bitmiyor.`;
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
  return `${s(name)} izin verilen bir değer değil.`;
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
    return `${s(name)} en azından bir karakter uzunluğunda olmalı.`;
    /* </i18n> */
  }
  if (min == 0 && max) {
    /* <i18n case="Shown when first argument supplied to the rule is 0, and the user-provided value is longer than the max (the 2nd argument) supplied to the rule."> */
    return `${s(name)} ${max}'e eşit veya daha küçük olmalı.`;
    /* </i18n> */
  }
  if (min === max) {
    /* <i18n case="Shown when first and second argument supplied to the rule are the same, and the user-provided value is not any of the arguments supplied to the rule."> */
    return `${s(name)} ${max} karakter uzunluğunda olmalıdır.`;
    /* </i18n> */
  }
  if (min && max === Infinity) {
    /* <i18n case="Shown when the length of the user-provided value is less than the minimum supplied to the rule and there is no maximum supplied to the rule."> */
    return `${s(name)} ${min}'e eşit veya daha büyük olmalı.`;
    /* </i18n> */
  }
  /* <i18n case="Shown when the length of the user-provided value is between the two lengths supplied to the rule."> */
  return `${s(name)}, ${min} ve ${max} karakter uzunluğu aralığında olmalı.`;
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
  return `${s(name)} izin verilen bir değer değil.`;
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
    return `${name}'in uzunluğu ${args[0]}'dan daha uzun olamaz.`;
    /* </i18n> */
  }
  /* <i18n case="Shown when the user-provided value is greater than the maximum number supplied to the rule."> */
  return `${s(name)} en azından ${args[0]} uzunluğunda veya ona eşit olmalı.`;
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
    return 'Hiçbir dosya türüne izin verilmez.';
    /* </i18n> */
  }
  /* <i18n case="Shown when the mime type of user-provided file does not match any mime types supplied to the rule."> */
  return `${s(name)} şu tiplerden biri olmalı: ${args[0]}`;
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
    return `${name}'in uzunluğu ${args[0]}'dan daha kısa olamaz.`;
    /* </i18n> */
  }
  /* <i18n case="Shown when the user-provided value is less than the minimum number supplied to the rule."> */
  return `${s(name)} en azından ${args[0]} uzunluğunda olmalı.`;
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
  return `“${value}” ${name} olamaz.`;
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
  return `${s(name)} sayı olmalı.`;
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
  return `${labels.join(' veya ')} gereklidir.`;
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
  return `${s(name)} gerekli.`;
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
  return `${s(name)} ${list(args)} ile başlamıyor.`;
  /* </i18n> */
};
/**
 * Is not a url
 * @see {@link https://formkit.com/essentials/validation#url}
 */
export const url: FormKitValidationMessage = function () {
  /* <i18n case="Shown when the user-provided value is not a valid url."> */
  return `Lütfen geçerli bir URL girin.`;
  /* </i18n> */
};
/**
 * Shown when the date is invalid.
 */
export const invalidDate = 'Seçilen tarih geçersiz.';
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