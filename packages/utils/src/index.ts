/**
 * Generates a random string.
 * @returns string
 * @public
 */
export function token(): string {
  return Math.random().toString(36).substring(2, 15)
}
/**
 * Creates a new set of the specified type and uses the values from an Array or
 * an existing Set.
 * @param items -
 * @returns Set
 * @public
 */
export function setify<T>(items: Set<T> | T[] | null | undefined): Set<T> {
  return items instanceof Set ? items : new Set<T>(items)
}

/**
 * Given 2 arrays, return them as a combined array with no duplicates.
 * @param arr1 -
 * @param arr2 -
 * @returns any[]
 * @public
 */
export function dedupe<T extends any[] | Set<any>, X extends any[] | Set<any>>(
  arr1: T,
  arr2?: X
): any[] {
  const original = arr1 instanceof Set ? arr1 : new Set(arr1)
  if (arr2) arr2.forEach((item: any) => original.add(item))
  return [...original]
}

/**
 * Checks if the given property exists on the given object.
 * @param obj -
 * @param property -
 * @public
 */
export function has(
  obj: { [index: string]: any; [index: number]: any },
  property: string | symbol | number
): boolean {
  return Object.prototype.hasOwnProperty.call(obj, property)
}

/**
 * Compare two values for equality optionally at depth.
 * @param valA - Any type of input
 * @param valB - Any type of output
 * @param deep - Indicate if we should recurse into the object
 * @param explicit - Explicit keys
 * @returns boolean
 * @public
 */
export function eq(
  valA: any, // eslint-disable-line
  valB: any, // eslint-disable-line
  deep = true,
  explicit: string[] = ['__key']
): boolean {
  if (valA === valB) return true
  if (typeof valB === 'object' && typeof valA === 'object') {
    if (valA instanceof Map) return false
    if (valA instanceof Set) return false
    if (valA instanceof Date) return false
    if (valA === null || valB === null) return false
    if (Object.keys(valA).length !== Object.keys(valB).length) return false
    for (const k of explicit) {
      if ((k in valA || k in valB) && valA[k] !== valB[k]) return false
    }
    for (const key in valA) {
      if (!(key in valB)) return false
      if (valA[key] !== valB[key] && !deep) return false
      if (deep && !eq(valA[key], valB[key], deep, explicit)) return false
    }
    return true
  }
  return false
}

/**
 * Determines if a value is empty or not.
 * @param value - any type of value that could be returned by an input.
 * @public
 */
export function empty(
  value: any // eslint-disable-line
): boolean {
  const type = typeof value
  if (type === 'number') return false
  if (value === undefined) return true
  if (type === 'string') {
    return value === ''
  }
  if (type === 'object') {
    if (value === null) return true
    for (const _i in value) return false
    if (value instanceof RegExp) return false
    if (value instanceof Date) return false
    return true
  }
  return false
}

/**
 * Escape a string for use in regular expressions.
 * @param string - The string to escape.
 * @public
 */
export function escapeExp(string: string): string {
  // $& means the whole matched string
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * The date token strings that can be used for date formatting.
 * @public
 */
export type FormKitDateTokens = 'MM' | 'M' | 'DD' | 'D' | 'YYYY' | 'YY'

/**
 * Given a string format (date) return a regex to match against.
 * @param format - The format of the string
 * @returns
 * @public
 */
export function regexForFormat(format: string): RegExp {
  const escaped = `^${escapeExp(format)}$`
  const formats: Record<FormKitDateTokens, string> = {
    MM: '(0[1-9]|1[012])',
    M: '([1-9]|1[012])',
    DD: '([012][0-9]|3[01])',
    D: '([012]?[0-9]|3[01])',
    YYYY: '\\d{4}',
    YY: '\\d{2}',
  }
  const tokens = Object.keys(formats) as FormKitDateTokens[]
  return new RegExp(
    tokens.reduce((regex, format) => {
      return regex.replace(format, formats[format])
    }, escaped)
  )
}

/**
 * Given a FormKit input type
 * @param type - Any FormKit input type
 * @public
 */
export function nodeType(type: string): 'list' | 'group' | 'input' {
  const t = type.toLowerCase()
  if (t === 'list') return 'list'
  if (t === 'group') return 'group'
  return 'input'
}

/**
 * Determines if an object is an object or not.
 * @param o - any value
 * @returns
 * @public
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function isObject(o: any): boolean {
  return Object.prototype.toString.call(o) === '[object Object]'
}

/**
 * Attempts to determine if an object is a plain object. Mostly lifted from
 * is-plain-object: https://github.com/jonschlinkert/is-plain-object
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * @param o - any value
 * @returns
 * @public
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function isPojo(o: any): o is Record<string, any> {
  if (isObject(o) === false) return false
  if (o.__FKNode__ || o.__POJO__ === false) return false
  const ctor = o.constructor
  if (ctor === undefined) return true
  const prot = ctor.prototype
  if (isObject(prot) === false) return false
  if (prot.hasOwnProperty('isPrototypeOf') === false) {
    return false
  }
  return true
}

/**
 * Recursively merge data from additional into original returning a new object.
 * @param original - An object to extend
 * @param additional - An object to modify the original object with.
 * @param arrays - By default replaces arrays, but can also append to them.
 * @param ignoreUndefined - when true it treats undefined values as if they dont exist
 * @public
 */
export function extend(
  original: Record<string, any>,
  additional: Record<string, any> | string | null,
  extendArrays = false,
  ignoreUndefined = false
): Record<string, any> | string | null {
  if (additional === null) return null
  const merged: Record<string, any> = {}
  if (typeof additional === 'string') return additional
  for (const key in original) {
    if (
      has(additional, key) &&
      (additional[key] !== undefined || !ignoreUndefined)
    ) {
      if (
        extendArrays &&
        Array.isArray(original[key]) &&
        Array.isArray(additional[key])
      ) {
        merged[key] = original[key].concat(additional[key])
        continue
      }
      if (additional[key] === undefined) {
        continue
      }
      if (isPojo(original[key]) && isPojo(additional[key])) {
        merged[key] = extend(
          original[key],
          additional[key],
          extendArrays,
          ignoreUndefined
        )
      } else {
        merged[key] = additional[key]
      }
    } else {
      merged[key] = original[key]
    }
  }
  for (const key in additional) {
    if (!has(merged, key) && additional[key] !== undefined) {
      merged[key] = additional[key]
    }
  }
  return merged
}

/**
 * Determine if the given string is fully quoted. Examples:
 * hello - false
 * "hello" - true
 * 'world' - true
 * "hello"=="world" - false
 * "hello'this'" - false
 * "hello"'there' - false
 * "hello""there" - false
 * 'hello === world' - true
 * @param str - A string to check.
 * @public
 */
export function isQuotedString(str: string): boolean {
  // quickly return false if the value is note quoted
  if (str[0] !== '"' && str[0] !== "'") return false
  if (str[0] !== str[str.length - 1]) return false
  const quoteType = str[0]
  for (let p = 1; p < str.length; p++) {
    if (
      str[p] === quoteType &&
      (p === 1 || str[p - 1] !== '\\') &&
      p !== str.length - 1
    ) {
      return false
    }
  }
  return true
}

/**
 * Remove extra escape characters.
 * @param str - A string to remove escape characters from.
 * @public
 */
export function rmEscapes(str: string): string {
  if (!str.length) return ''
  let clean = ''
  let lastChar = ''
  for (let p = 0; p < str.length; p++) {
    const char = str.charAt(p)
    if (char !== '\\' || lastChar === '\\') {
      clean += char
    }
    lastChar = char
  }
  return clean
}

/**
 * Performs a recursive Object.assign like operation.
 * @param a - An object to be extended by object b
 * @param b - An object to copy values from
 * @public
 */
export function assignDeep<
  A extends Record<PropertyKey, any>,
  B extends Record<PropertyKey, any>
>(a: A, b: B): A & B {
  for (const key in a) {
    if (
      has(b, key) &&
      a[key] !== b[key] &&
      !(isPojo(a[key]) && isPojo(b[key]))
    ) {
      a[key] = b[key]
    } else if (isPojo(a[key]) && isPojo(b[key])) {
      assignDeep(a[key], b[key])
    }
  }
  for (const key in b) {
    if (!has(a, key)) {
      a[key] = b[key]
    }
  }
  return a
}

/**
 * Filters out values from an object that should not be considered "props" of
 * a core node, like "value" and "name".
 * @param attrs - An object to extract core node config from.
 * @public
 */
export function nodeProps(
  ...sets: Array<Record<string, any>>
): Record<string, any> {
  return sets.reduce((valid, props) => {
    const { value, name, modelValue, config, plugins, ...validProps } = props // eslint-disable-line
    return Object.assign(valid, validProps)
  }, {})
}

/**
 * Parse a string for comma-separated arguments
 * @param str - A string to parse
 * @public
 */
export function parseArgs(str: string): string[] {
  const args: string[] = []
  let arg = ''
  let depth = 0
  let quote = ''
  let lastChar = ''
  for (let p = 0; p < str.length; p++) {
    const char = str.charAt(p)
    if (char === quote && lastChar !== '\\') {
      quote = ''
    } else if ((char === "'" || char === '"') && !quote && lastChar !== '\\') {
      quote = char
    } else if (char === '(' && !quote) {
      depth++
    } else if (char === ')' && !quote) {
      depth--
    }
    if (char === ',' && !quote && depth === 0) {
      if (isQuotedString(arg)) arg = rmEscapes(arg.substr(1, arg.length - 2))
      args.push(arg)
      arg = ''
    } else if (char !== ' ' || quote) {
      arg += char
    }
    lastChar = char
  }
  if (arg) {
    if (isQuotedString(arg)) arg = rmEscapes(arg.substr(1, arg.length - 2))
    args.push(arg)
  }
  return args
}

/**
 * Return a new (shallow) object with all properties from a given object
 * that are present in the array.
 * @param obj - An object to clone
 * @param toRemove - An array of keys to remove
 * @public
 */
export function except(
  obj: Record<string, any>,
  toRemove: Array<string | RegExp>
): Record<string, any> {
  const clean: Record<string, any> = {}
  const exps = toRemove.filter((n) => n instanceof RegExp) as RegExp[]
  const keysToRemove = new Set(toRemove)
  for (const key in obj) {
    if (!keysToRemove.has(key) && !exps.some((exp) => exp.test(key))) {
      clean[key] = obj[key]
    }
  }
  return clean
}

/**
 * Extracts a set of keys from a given object. Importantly, this will extract
 * values even if they are not set on the original object they will just have an
 * undefined value.
 * @param obj - An object to extract values from
 * @param include - A set of keys to extract
 * @returns
 * @public
 */
export function only(
  obj: Record<string, any>,
  include: Array<string | RegExp>
): Record<string, any> {
  const clean: Record<string, any> = {}
  const exps = include.filter((n) => n instanceof RegExp) as RegExp[]
  include.forEach((key) => {
    if (!(key instanceof RegExp)) {
      clean[key] = obj[key]
    }
  })
  Object.keys(obj).forEach((key) => {
    if (exps.some((exp) => exp.test(key))) {
      clean[key] = obj[key]
    }
  })
  return clean
}

/**
 * This converts kebab-case to camelCase. It ONLY converts from kebab for
 * efficiency stake.
 * @param str - String to convert.
 * @public
 */
export function camel(str: string): string {
  return str.replace(/-([a-z0-9])/gi, (_s: string, g: string) =>
    g.toUpperCase()
  )
}

/**
 * This converts camel-case to kebab case. It ONLY converts from camel to kebab.
 * @param str - Converts camel to kebab
 * @returns
 * @public
 */
export function kebab(str: string): string {
  return str
    .replace(
      /([a-z0-9])([A-Z])/g,
      (_s: string, trail: string, cap: string) =>
        trail + '-' + cap.toLowerCase()
    )
    .replace(' ', '-')
    .toLowerCase()
}

/**
 * Very shallowly clones the given object.
 * @param obj - The object to shallow clone
 * @returns
 */
export function shallowClone<T>(obj: T): T {
  if (typeof obj === 'object') {
    if (Array.isArray(obj)) return [...obj] as unknown as T
    if (isPojo(obj)) return { ...obj }
  }
  return obj
}

/**
 * Perform a recursive clone on a given object. This only intended to be used
 * for simple objects like arrays and pojos.
 * @param obj - Object to clone
 * @public
 */
export function clone<T extends Record<string, unknown> | unknown[] | null>(
  obj: T,
  explicit: string[] = ['__key', '__init']
): T {
  if (
    obj === null ||
    obj instanceof RegExp ||
    obj instanceof Date ||
    (typeof File === 'function' && obj instanceof File)
  )
    return obj
  let returnObject
  if (Array.isArray(obj)) {
    returnObject = obj.map((value) => {
      if (typeof value === 'object') return clone(value as unknown[], explicit)
      return value
    }) as T
  } else {
    returnObject = Object.keys(obj).reduce((newObj, key) => {
      newObj[key] =
        typeof obj[key] === 'object'
          ? clone(obj[key] as unknown[], explicit)
          : obj[key]
      return newObj
    }, {} as Record<string, unknown>) as T
  }
  for (const key of explicit) {
    if (key in obj) {
      Object.defineProperty(returnObject, key, {
        enumerable: false,
        value: (obj as any)[key],
      })
    }
  }
  return returnObject
}

/**
 * Clones anything. If the item is scalar, no worries, it passes it back. if it
 * is an object, it performs a (fast/loose) clone operation.
 * @param obj - The object to clone
 * @public
 */
export function cloneAny<T>(obj: T): T {
  return typeof obj === 'object'
    ? (clone(obj as Record<string, unknown>) as T)
    : obj
}

/**
 * Get a specific value via dot notation.
 * @param obj - An object to fetch data from
 * @param addr - An "address" in dot notation
 * @public
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function getAt(obj: any, addr: string): unknown {
  if (!obj || typeof obj !== 'object') return null
  const segments = addr.split('.')
  let o = obj
  for (const i in segments) {
    const segment = segments[i]
    if (has(o, segment)) {
      o = o[segment]
    }
    if (+i === segments.length - 1) return o
    if (!o || typeof o !== 'object') return null
  }
  return null
}

/**
 * Determines if the value of a prop that is either present (true) or not
 * present (false). For example the prop disabled should disable
 * by just existing, but what if it is set to the string "false" — then it
 * should not be disabled.
 * @param value - value to be checked
 * @returns
 * @public
 */
export function undefine(value: unknown): true | undefined {
  return value !== undefined && value !== 'false' && value !== false
    ? true
    : undefined
}

/**
 * Defines an object as an initial value.
 * @param obj - Object
 * @returns
 * @public
 */
/* eslint-disable-next-line @typescript-eslint/ban-types */
export function init<T extends object>(obj: T): T & { __init: true } {
  return Object.defineProperty(obj, '__init', {
    enumerable: false,
    value: true,
  }) as T & { __init: true }
}

/**
 * Turn any string into a URL/DOM safe string.
 * @public
 */
export function slugify(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
}
