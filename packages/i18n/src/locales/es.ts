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
export const add = 'Añadir';
/**
 * Shown when a button to remove items is visible.
 */
export const remove = 'Quitar';
/**
 * Shown when there are multiple items to remove at the same time.
 */
export const removeAll = 'Quitar todos';
/**
 * Shown when all fields are not filled out correctly.
 */
export const incomplete = 'Discúlpe, los campos no fueron completados correctamente.';
/**
 * Shown in a button inside a form to submit the form.
 */
export const submit = 'Enviar';
/**
 * Shown when no files are selected.
 */
export const noFiles = 'Archivo no seleccionado';
/**
 * Shown on buttons that move fields up in a list.
 */
export const moveUp = 'Moverse hacia arriba';
/**
 * Shown on buttons that move fields down in a list.
 */
export const moveDown = 'Moverse hacia abajo';
/**
 * Shown when something is actively loading.
 */
export const isLoading = 'Cargando...';
/**
 * Shown when there is more to load.
 */
export const loadMore = 'Cargar más';
/**
 * Shown on buttons that navigate state forward
 */
export const next = 'Próximo';
/**
 * Shown on buttons that navigate state backward
 */
export const prev = 'Anterior';
/**
 * Shown when adding all values.
 */
export const addAllValues = 'Añadir todos los valores';
/**
 * Shown when adding selected values.
 */
export const addSelectedValues = 'Añadir valores seleccionados';
/**
 * Shown when removing all values.
 */
export const removeAllValues = 'Eliminar todos los valores';
/**
 * Shown when removing selected values.
 */
export const removeSelectedValues = 'Eliminar los valores seleccionados';
/**
 * Shown when there is a date to choose.
 */
export const chooseDate = 'Elige fecha';
/**
 * Shown when there is a date to change.
 */
export const changeDate = 'Cambiar fecha';
/**
 * Shown when there is something to close
 */
export const close = 'Cerrar';
/**
 * Shown when there is something to open.
 */
export const open = 'Abrir';
/**
 * The value is not an accepted value.
 * @see {@link https://formkit.com/essentials/validation#accepted}
 */
export const accepted: FormKitValidationMessage = function ({
  name
}) {
  /* <i18n case="Shown when the user-provided value is not a valid 'accepted' value."> */
  return `Acepte el ${name} por favor.`;
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
    return `${s(name)} debe ser posterior a ${date(args[0])}.`;
    /* </i18n> */
  }
  /* <i18n case="Shown when the user-provided date is not after today's date, since no date was supplied to the rule."> */
  return `${s(name)} debe ser una fecha futura.`;
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
  return `${s(name)} debe contener solo caractéres alfabéticos.`;
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
  return `${s(name)} debe ser alfanumérico.`;
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
  return `${s(name)} espacios alfa solo pueden contener letras y espacios.`;
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
  return `${s(name)} debe contener caracteres alfabéticos.`;
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
  return `${s(name)} debe contener letras o números.`;
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
  return `${s(name)} debe contener letras o espacios.`;
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
  return `${s(name)} debe contener un símbolo.`;
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
  return `${s(name)} debe estar en mayúsculas.`;
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
  return `${s(name)} debe contener minúsculas.`;
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
  return `${s(name)} debe contener números.`;
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
  return `${s(name)} debe ser un símbolo.`;
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
  return `${s(name)} solo puede contener letras mayúsculas.`;
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
  return `${s(name)} solo puede contener letras minúsculas.`;
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
    return `${s(name)} debe ser anterior a ${date(args[0])}.`;
    /* </i18n> */
  }
  /* <i18n case="Shown when the user-provided date is not before today's date, since no date was supplied to the rule."> */
  return `${s(name)} debe ser una fecha pasada.`;
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
    return `El campo no fue completado correctamente y no puede ser enviado.`;
    /* </i18n> */
  }
  const [a, b] = order(args[0], args[1]);
  /* <i18n case="Shown when the user-provided value is not between two numbers."> */
  return `${s(name)} debe estar entre ${a} y ${b}.`;
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
  return `${s(name)} no coincide.`;
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
    return `${s(name)} no es una fecha válida, por favor utilice el formato ${args[0]}`;
    /* </i18n> */
  }
  /* <i18n case="Shown when no date argument was supplied to the rule."> */
  return 'El campo no fue completado correctamente y no puede ser enviado.';
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
  return `${s(name)} debe estar entre ${date(args[0])} y ${date(args[1])}`;
  /* </i18n> */
};
/**
 * Shown when the user-provided value is not a valid email address.
 * @see {@link https://formkit.com/essentials/validation#email}
 */
export const email = 'Ingrese una dirección de correo electrónico válida por favor.';
/**
 * Does not end with the specified value
 * @see {@link https://formkit.com/essentials/validation#ends-with}
 */
export const ends_with: FormKitValidationMessage = function ({
  name,
  args
}) {
  /* <i18n case="Shown when the user-provided value does not end with the substring supplied to the rule."> */
  return `${s(name)} no termina con ${list(args)}.`;
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
  return `${s(name)} no es un valor permitido.`;
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
    return `${s(name)} debe tener al menos una letra.`;
    /* </i18n> */
  }
  if (min == 0 && max) {
    /* <i18n case="Shown when first argument supplied to the rule is 0, and the user-provided value is longer than the max (the 2nd argument) supplied to the rule."> */
    return `${s(name)} debe tener como máximo ${max} caractéres.`;
    /* </i18n> */
  }
  if (min === max) {
    /* <i18n case="Shown when first and second argument supplied to the rule are the same, and the user-provided value is not any of the arguments supplied to the rule."> */
    return `${s(name)} debe tener ${max} caracteres.`;
    /* </i18n> */
  }
  if (min && max === Infinity) {
    /* <i18n case="Shown when the length of the user-provided value is less than the minimum supplied to the rule and there is no maximum supplied to the rule."> */
    return `${s(name)} debe tener como mínimo ${min} caractéres.`;
    /* </i18n> */
  }
  /* <i18n case="Shown when the length of the user-provided value is between the two lengths supplied to the rule."> */
  return `${s(name)} debe tener entre ${min} y ${max} caractéres.`;
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
  return `${s(name)} no es un valor permitido.`;
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
    return `No puede tener más de ${args[0]} ${name}.`;
    /* </i18n> */
  }
  /* <i18n case="Shown when the user-provided value is greater than the maximum number supplied to the rule."> */
  return `${s(name)} debe ser menor o igual a ${args[0]}.`;
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
    return 'No existen formatos de archivos permitidos.';
    /* </i18n> */
  }
  /* <i18n case="Shown when the mime type of user-provided file does not match any mime types supplied to the rule."> */
  return `${s(name)} debe ser del tipo: ${args[0]}`;
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
    return `No puede tener menos de ${args[0]} ${name}.`;
    /* </i18n> */
  }
  /* <i18n case="Shown when the user-provided value is less than the minimum number supplied to the rule."> */
  return `${s(name)} debe ser de al menos ${args[0]}.`;
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
  return `“${value}” no es un valor permitido de ${name}.`;
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
  return `${s(name)} debe ser un número.`;
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
  return `${labels.join(' o ')} se requiere estar.`;
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
  return `${s(name)} es requerido.`;
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
  return `${s(name)} debe comenzar con ${list(args)}.`;
  /* </i18n> */
};
/**
 * Is not a url
 * @see {@link https://formkit.com/essentials/validation#url}
 */
export const url: FormKitValidationMessage = function () {
  /* <i18n case="Shown when the user-provided value is not a valid url."> */
  return `Introduce una URL válida.`;
  /* </i18n> */
};
/**
 * Shown when the date is invalid.
 */
export const invalidDate = 'La fecha seleccionada no es válida.';
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