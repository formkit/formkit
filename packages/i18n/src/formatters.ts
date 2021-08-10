/**
 * Given a string, convert it to sentence case.
 * @param item - The string to sentence case
 * @returns
 */
export function sentence(str: string): string {
  return str[0].toUpperCase() + str.substr(1)
}
