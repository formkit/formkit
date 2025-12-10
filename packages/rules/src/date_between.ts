import { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value is between two other dates.
 * @param context - The FormKitValidationContext
 * @public
 */
const date_between: FormKitValidationRule = function date_between(
  { value },
  dateA,
  dateB
) {
  dateA = dateA instanceof Date ? dateA.getTime() : Date.parse(dateA)
  dateB = dateB instanceof Date ? dateB.getTime() : Date.parse(dateB)
  const compareTo =
    value instanceof Date ? value.getTime() : Date.parse(String(value))
  if (dateA && isNaN(dateB)) {
    dateB = dateA
    dateA = Date.now()
  } else if (dateA === undefined || compareTo === undefined) {
    return false
  }
  return compareTo >= dateA && compareTo <= dateB
}

export default date_between
