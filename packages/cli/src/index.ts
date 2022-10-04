import { FORMKIT_VERSION } from '@formkit/core'
import { Command } from 'commander'
import chalk from 'chalk'
import { exportInput } from './exportInput'
import { createApp } from './createApp'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

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
  .option(
    '--pro <key>',
    'Creates the project with FormKit pro installed if a project key is provided.'
  )
  .description('Creates a new Vue 3 Vite application with FormKit installed.')
  .action(createApp)

/**
 * @internal
 */
export default function main(): void {
  program.parse()
}

/**
 * @internal
 */
export function error(message: string): never {
  red(message)
  process.exit(1)
}
