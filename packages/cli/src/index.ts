import { FORMKIT_VERSION } from '@formkit/core'
import { Command } from 'commander'
import chalk from 'chalk'
import { exportInput } from './exportInput'
import { createApp } from './createApp'
import { buildTheme } from './theme'
import { createTheme } from './createTheme'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { execa } from 'execa'

const __filename = fileURLToPath(import.meta.url)

/**
 * @internal
 */
export const __dirname = dirname(__filename)

/**
 * @internal
 */
export const red = (m: string): void =>
  console.log(`${chalk.red.bold('[FormKit Error]: ')} ${chalk.red(m)}`)

/**
 * @internal
 */
export const info = (m: string): void => {
  console.log(`${chalk.blue(m)}`)
}

/**
 * @internal
 */
export const warning = (m: string): void => {
  console.log(`${chalk.yellow.bold('[FormKit Warn]: ')} ${chalk.yellow(m)}`)
}

/**
 * @internal
 */
export const green = (m: string): void => {
  console.log(chalk.greenBright(m))
}

const program = new Command()

program
  .name('FormKit CLI')
  .description('The official FormKit command line utility.')
  .version(FORMKIT_VERSION)

program
  .command('export')
  .argument(
    '[input]',
    'An input to export (from @formkit/inputs, like "text" or "select")'
  )
  .description(
    'Export an input from @formkit/inputs to a local file for modification.'
  )
  .option('-d, --dir <dir>', 'The directory to export inputs to')
  .option('-l, --lang <ts|js>', 'Export as TypeScript (ts) or JavaScript (js)')
  .action(exportInput)

program
  .command('create-app')
  .argument('[name]', 'Creates a vite application with this name.')
  .option(
    '-l, --lang <ts|js>',
    'Create a TypeScript (ts) or JavaScript (js) app.'
  )
  .option('-f, --framework <vite|nuxt>', 'Create a new Vite or Nuxt app.')
  .option(
    '--pro <key>',
    'Creates the project with FormKit pro installed if a project key is provided.'
  )
  .description('Creates a new Vue 3 Vite application with FormKit installed.')
  .action(createApp)

program
  .command('theme')
  .option(
    '--theme <theme>',
    'A published theme or local npm theme package identifier.'
  )
  .option(
    '-s',
    '--semantic',
    'Build the theme as semantic classes rather than utility classes.'
  )
  .option(
    '--variables <variables>',
    'A comma separated list of variables to include in the theme. For example: --variables "primaryColor=#221233, padding=10"'
  )
  .option(
    '--api <url>',
    'An alternative API endpoint to use for theme fetching and generation.'
  )
  .description(
    'Creates a FormKit theme file (formkit.theme.ts) using a known theme and variables.'
  )
  .action(buildTheme)

program
  .command('create-theme')
  .argument('[name]', 'The public name of the theme, for example "Monokai".')
  .option(
    '--package-name <packageName>',
    'The name of the package on npm, for example formkit-theme-monokai.'
  )
  .option('--dir <directory>', 'The relative directory to create the theme in.')
  .description('Scaffold a new theme from @formkit/theme-starter.')
  .action(createTheme)

/**
 * @internal
 */
export async function cli(): Promise<void> {
  const res = await execa('npx', ['--version'])
  const [major] = res.stdout.trim().split('.')
  if (Number(major) < 7) {
    error(`Your npm version must be 7 or higher (found ${res.stdout.trim()}).`)
  }
  program.parse()
}

export * from './theme'

/**
 * @internal
 */
export function error(message: string): never {
  red(message)
  process.exit(1)
}
