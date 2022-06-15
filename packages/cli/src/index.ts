// import { FORMKIT_VERSION } from '@formkit/core'
// import fs from 'fs/promises'
import { Command } from 'commander'
import { inputs } from '@formkit/inputs'
import chalk from 'chalk'

const red = (m: string) => console.log(chalk.red.bold(m))
const green = (m: string) => console.log(chalk.greenBright(m))
const program = new Command()

const FORMKIT_VERSION = '1.0.0-beta.9'

program
  .name('FormKit CLI')
  .description('The official FormKit command line utility.')
  .version(FORMKIT_VERSION)

program
  .command('export')
  .argument('<inputName>', 'An input to export (from @formkit/inputs)')
  .action(exportInput)

/**
 * @internal
 */
export default function main(): void {
  program.parse()
}

function error(message: string): void {
  console.error(red(message))
  process.exit(1)
}

/**
 * @internal
 */
export function exportInput(inputName: string): void {
  if (!(inputName in inputs)) {
    return error(
      `Cannot export “${inputName}” — it is not part of the @formkit/inputs package.`
    )
  }
  green(`Exporting ${inputName}...`)
}
