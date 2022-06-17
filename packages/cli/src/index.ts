// import { FORMKIT_VERSION } from '@formkit/core'
// import fs from 'fs/promises'
import { Command } from 'commander'
import prompts from 'prompts'
import { inputs } from '@formkit/inputs'
import { resolve, dirname } from 'path'
import { access, mkdir } from 'fs/promises'
import { constants, existsSync } from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const red = (m: string): void =>
  console.log(`${chalk.red.bold('[FormKit Error]: ')} ${chalk.red(m)}`)
const info = (m: string): void => {
  console.log(`${chalk.blue(m)}`)
}
const green = (m: string): void => {
  console.log(chalk.greenBright(m))
}
const program = new Command()

const FORMKIT_VERSION = '1.0.0-beta.9'

program
  .name('FormKit CLI')
  .description('The official FormKit command line utility.')
  .version(FORMKIT_VERSION)

program
  .command('export')
  .argument('<inputName>', 'An input to export (from @formkit/inputs)')
  .option('-d, --dir <dir>', 'The directory to export inputs to')
  .option('-l, --lang <ts|js>', 'Export as TypeScript (ts) or JavaScript (js)')
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
export async function exportInput(
  inputName: string,
  options: Record<string, string>
): Promise<void> {
  if (!(inputName in inputs)) {
    return error(
      `Cannot export “${inputName}” because it is not part of the @formkit/inputs package.`
    )
  }
  const outDir = resolve(process.cwd(), options.dir || './inputs')
  const lang = options.lang || 'ts'

  const validDir = await upsertDir(outDir)
  if (validDir === false) return error(`${outDir} is not a writable directory.`)
  if (!validDir) return

  green(`Exporting ${outDir}/${inputName}.${lang}`)
}

/**
 * Checks if a given directory is writable, if it doesn't exist, create it.
 * @param dir - A directory to create if it doesn't exist.
 * @returns
 */
async function upsertDir(dir: string): Promise<boolean | void> {
  if (!existsSync(dir)) {
    const { confirm } = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: `${dir} does not exist. Create it?`,
    })
    if (!confirm) return info('Directory not created — no input was exported.')
    try {
      await mkdir(dir, { recursive: true })
    } catch {
      return error(`Unable to create directory ${dir}.`)
    }
  }
  try {
    await access(dir, constants.W_OK)
    return true
  } catch (err) {
    return false
  }
}
