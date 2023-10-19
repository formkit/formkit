import { existsSync } from 'fs'
import { writeFile } from 'fs/promises'
import { resolve } from 'pathe'
import { error, green, __dirname, info } from './index'
import { Theme, ThemeOptions } from '@formkit/theme-creator'
import { stylesheetFromTailwind } from '@formkit/theme-creator/stylesheet'

interface BuildThemeOptions {
  semantic: boolean
  variables?: string
  api?: string
  format?: 'ts' | 'mjs'
  outFile?: string
}

const DEFAULT_THEME_API = 'https://themes.formkit.com/api'
const HAS_EXTENSION_RE = /\.(?:ts|js|mjs|cjs)$/

export async function buildTheme(
  themeName: string,
  options: Partial<BuildThemeOptions> = {}
) {
  if (!themeName) error('Please provide a theme name or path to a theme file.')
  green(`Locating ${themeName}...`)
  const endpoint = options.api || DEFAULT_THEME_API

  const format = options.format || guessFormat()
  const theme = themeName?.startsWith('./')
    ? await generate(
        await localTheme(themeName),
        options.variables,
        format === 'ts',
        options.semantic
      )
    : await apiTheme(themeName, endpoint)

  const outFile =
    options.outFile || 'formkit.theme.' + (options.semantic ? 'css' : format)
  await writeFile(resolve(process.cwd(), outFile), theme)
  green(`Theme file written to ${outFile}`)
}

function guessFormat() {
  return existsSync(resolve(process.cwd(), 'tsconfig.json')) ? 'ts' : 'mjs'
}

async function generate(
  theme: Theme<ThemeOptions>,
  variables?: string,
  isTS?: boolean,
  semantic?: boolean
): Promise<string> {
  info(`Loaded theme: ${theme.meta.name}`)
  const vars = parseVariables(variables)
  const classes = theme(vars).tailwind()
  if (semantic) return await stylesheetFromTailwind(classes)
  const classList: Record<string, Record<string, true>> = {}
  const globals: Record<string, Record<string, true>> = {}

  for (const input in classes) {
    for (const section in classes[input]) {
      const key = `${input}__${section}`
      const sectionClasses = classes[input][section]
        .split(' ')
        .reduce((acc, cur) => {
          acc[cur] = true
          return acc
        }, {} as Record<string, true>)
      if (input === '__globals') {
        globals[section] = sectionClasses
      } else {
        classList[key] = sectionClasses
      }
    }
  }

  const themeFile = `${
    isTS ? "import type { FormKitNode } from '@formkit/core'\n\n" : ''
  }/**
 * These classes have already been merged with globals using tailwind-merge
 * and are ready to be used directly in the theme.
 **/
const classes${
    isTS ? ': Record<string, Record<string, boolean>>' : ''
  } = ${JSON.stringify(classList, null, 2)};

/**
 * Globals are merged prior to generating this file — these are included for
 * any other non-matching inputs.
 **/
const globals${
    isTS ? ': Record<string, Record<string, boolean>>' : ''
  } = ${JSON.stringify(globals, null, 2)};

/**
 * This is the theme function itself, it should be imported and used as the
 * config.rootClasses function. For example:
 *
 * \`\`\`js
 * import { theme } from './formkit.theme'
 * import { defineFormKitConfig } from '@formkit/vue'
 *
 * export default defineFormKitConfig({
 *   config: {
 *     rootClasses: theme
 *   }
 * })
 * \`\`\`
 **/
export function theme (sectionName${isTS ? ': string' : ''}, node${
    isTS ? ': FormKitNode' : ''
  })${isTS ? ': Record<string, boolean>' : ''} {
  const key = \`\${node.props.type}__\${sectionName}\`
  if (key in classes) return classes[key]
  if (sectionName in globals) return classes[sectionName]
  return {}
}
`
  return themeFile
}

function parseVariables(variables?: string): Record<string, string> {
  if (!variables) return {}
  return variables.split(',').reduce((vars, unparsed) => {
    const [key, value] = unparsed.split('=')
    vars[key] = value
    return vars
  }, {} as Record<string, string>)
}

function getPath(paths: string[]): string | undefined {
  const path = paths.shift()
  if (existsSync(path!)) return path
  return paths.length ? getPath(paths) : undefined
}

async function localTheme(
  themeName: string
): Promise<Theme<ThemeOptions>> | never {
  const extensions = ['.ts', '.js', '.mjs', '.cjs']
  const paths = HAS_EXTENSION_RE.test(themeName)
    ? [resolve(process.cwd(), themeName)]
    : extensions.map((ext) => resolve(process.cwd(), themeName + ext))
  const path = getPath(paths)
  if (!path) error(`Could not find ${themeName}.`)
  const theme = (await import(path)) as { default: Theme<ThemeOptions> }
  if (typeof theme !== 'object' || !theme.default) error('Invalid theme file.')
  return theme.default
}

async function apiTheme(themeName: string, endpoint: string): Promise<string> {
  return `${endpoint}${themeName}`
}
