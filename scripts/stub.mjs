/* @ts-check */
import cac from 'cac'
import prompts from 'prompts'
import chalk from 'chalk'
import { getPackages } from './utils.mjs'

async function stub() {
  const packages = await getPackages()
  console.log(packages)
}

export default function () {
  const cli = cac()
  cli
    .command('[package]', 'Stub a packages dist directory (runtime).', {
      allowUnknownOptions: true,
    })
    .action(stub)
  cli.help()
  cli.parse()
}
