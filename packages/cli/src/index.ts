// import { FORMKIT_VERSION } from '@formkit/core'
import { Command } from 'commander'

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

/**
 * @internal
 */
export function exportInput(inputName: string): void {
  console.log(`Exporting ${inputName}`)
}
