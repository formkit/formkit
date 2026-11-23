/* @ts-check */
import { execa } from 'execa'
import { getPackages } from './utils.mjs'

async function publint(packages) {
  if (!packages) {
    const packages = await getPackages()
    if (process.argv[2] && packages.includes(process.argv[2])) {
      return await publint([process.argv[2]])
    }
    return await publint(packages)
  }
  const pkg = packages.shift()
  if (!pkg) return
  // execa 9 removed .pipeStdout(); stream output straight through instead.
  await execa('npx', ['publint', `./packages/${pkg}`], { stdio: 'inherit' })
  await publint(packages)
}

publint()
