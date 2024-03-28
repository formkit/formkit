/* @ts-check */
import { getPackages } from './utils.mjs'

async function stub() {
  const packages = await getPackages()
  console.log(packages)
}

/**
 * Adds the stub command.
 * @param {typeof import('cac').default} cli
 */
export default function (cli) {
  cli
    .command('stub [package]', 'Stub a packages dist directory (runtime).', {
      allowUnknownOptions: true,
    })
    .action(stub)
}
