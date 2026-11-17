/**
 * Tailwind class prefixing for generated theme files (#1157).
 *
 * - Tailwind v4: the prefix is a variant on the whole class:
 *   `hover:bg-red-500` → `tw:hover:bg-red-500` (configure `prefix(tw)`).
 * - Tailwind v3: the prefix goes on the utility, after any variants and
 *   `!`/`-` modifiers: `hover:-mt-2` → `hover:-tw-mt-2`, `group` → `tw-group`
 *   (configure `prefix: 'tw-'`).
 *
 * FormKit's own `formkit-*` classes are never prefixed.
 */

export type TailwindVersion = 3 | 4

/**
 * Validate and normalize a user supplied prefix for a Tailwind version.
 * @param prefix - The raw prefix, e.g. `tw`, `tw:` or `tw-`.
 * @param version - The Tailwind major version.
 */
export function normalizePrefix(
  prefix: string,
  version: TailwindVersion
): string {
  const p = prefix.trim()
  if (version === 4) {
    const v4 = p.replace(/:$/, '')
    if (!/^[a-z]+$/.test(v4)) {
      throw new Error(
        `Tailwind v4 prefixes must be lowercase letters only (got "${prefix}"), e.g. --prefix tw`
      )
    }
    return v4
  }
  if (!/^[A-Za-z0-9_-]+$/.test(p)) {
    throw new Error(`Invalid Tailwind v3 prefix "${prefix}", e.g. --prefix tw-`)
  }
  return p
}

/**
 * Split a class into its variants and utility, ignoring colons inside
 * arbitrary values/variants (`[&:hover]`, `bg-[url(a:b)]`).
 */
function splitVariants(className: string): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (const char of className) {
    if (char === '[' || char === '(') depth++
    else if (char === ']' || char === ')') depth--
    if (char === ':' && depth === 0) {
      parts.push(current)
      current = ''
    } else {
      current += char
    }
  }
  parts.push(current)
  return parts
}

/**
 * Prefix a single Tailwind class.
 * @param className - The class to prefix.
 * @param prefix - A normalized prefix (see normalizePrefix).
 * @param version - The Tailwind major version.
 */
export function prefixClass(
  className: string,
  prefix: string,
  version: TailwindVersion
): string {
  if (!className || className.startsWith('formkit-')) return className
  if (version === 4) {
    return className.startsWith(prefix + ':')
      ? className
      : `${prefix}:${className}`
  }
  const parts = splitVariants(className)
  let utility = parts.pop()!
  let modifiers = ''
  // Leading important (!) and negative (-) modifiers stay in front.
  while (utility.startsWith('!') || utility.startsWith('-')) {
    modifiers += utility[0]
    utility = utility.slice(1)
  }
  if (!utility.startsWith(prefix)) utility = prefix + utility
  return [...parts, modifiers + utility].join(':')
}

/**
 * Apply a prefix to every class key in the `classes` and `globals` maps of a
 * generated theme file, and record it in the header (`@prefix -`).
 * @param code - The generated theme file.
 * @param prefix - A normalized prefix.
 * @param version - The Tailwind major version.
 */
export function prefixGeneratedTheme(
  code: string,
  prefix: string,
  version: TailwindVersion
): string {
  for (const name of ['classes', 'globals']) {
    const start = code.search(new RegExp(`\\nconst ${name}\\b[^=]*= \\{`))
    if (start === -1) {
      throw new Error(`Unable to find the ${name} map in the theme file.`)
    }
    const open = code.indexOf('{', code.indexOf('=', start))
    const close = code.indexOf('\n};', open)
    if (close === -1) {
      throw new Error(`Unable to find the end of the ${name} map.`)
    }
    const map = JSON.parse(code.slice(open, close + 2)) as Record<
      string,
      Record<string, boolean>
    >
    for (const section in map) {
      map[section] = Object.fromEntries(
        Object.entries(map[section]).map(([cls, on]) => [
          prefixClass(cls, prefix, version),
          on,
        ])
      )
    }
    code =
      code.slice(0, open) + JSON.stringify(map, null, 2) + code.slice(close + 2)
  }
  return code.replace(
    /(\* @theme - [^\n]*\n)/,
    `$1  * @prefix - ${prefix}\n`
  )
}

/**
 * Read the `@prefix -` header from a generated theme file, if any.
 * @param code - The generated theme file.
 */
export function extractThemePrefix(code: string): string | undefined {
  const match = code.match(/\* @prefix - ([^\s]+)/)
  return match ? match[1] : undefined
}
