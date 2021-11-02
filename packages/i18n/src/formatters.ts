/**
 * Given a string, convert it to sentence case.
 * @param item - The string to sentence case
 * @returns
 */
export function sentence(str: string): string {
  return str[0].toUpperCase() + str.substr(1)
}

/**
 * Creates an oxford-comma separated list of items.
 * @param args - items to list out
 * @param conjunction - in: x, y, and z "and" is the conjunction to use
 * @returns
 */
export function list(items: string[], conjunction = 'or'): string {
  return items.reduce((oxford, item, index) => {
    oxford += item
    if (index <= items.length - 2 && items.length > 2) {
      oxford += ', '
    }
    if (index === items.length - 2) {
      oxford += `${items.length === 2 ? ' ' : ''}${conjunction} `
    }
    return oxford
  }, '')
}
