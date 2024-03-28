/* @ts-check */
import { cpSync } from 'fs'
import { build } from 'unbuild'
import { getPackages } from './utils.mjs'
import { rootDir } from './utils.mjs'
import { resolve } from 'pathe'

async function stub() {
  // const packages = await getPackages()
  const path = resolve(rootDir(), 'packages/core')
  await build(path, true)
  cpSync(resolve(path, 'dist/index.mjs'), resolve(path, 'dist/index.dev.mjs'))
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
