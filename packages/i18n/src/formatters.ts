/**
 * Given a string, convert it to sentence case.
 * @param item - The string to sentence case
 * @returns
 * @public
 */
export function sentence(str: string): string {
  return str[0].toUpperCase() + str.substr(1)
}

/**
 * Creates an oxford-comma separated list of items.
 * @param args - items to list out
 * @param conjunction - in: x, y, and z "and" is the conjunction to use
 * @returns
 * @public
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

/**
 * Given a string or a date return a nice human-readable version.
 * @param date - A string or a date.
 * @public
 */
export function date(date: string | Date): string {
  const dateTime = typeof date === 'string' ? new Date(Date.parse(date)) : date
  if (!(dateTime instanceof Date)) {
    return '(unknown)'
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  } as any).format(dateTime)
}

/**
 * Orders two variables smallest to largest.
 * @param first - first argument
 * @param second - Second argument
 * @returns
 * @public
 */
export function order(
  first: string | number,
  second: string | number
): [smaller: number | string, larger: number | string] {
  return Number(first) >= Number(second) ? [second, first] : [first, second]
}
