import { getPackages } from './utils.mjs'
import cac from 'cac'
import { execSync } from 'child_process'

async function publishLocal() {
  const packages = getPackages()
  for (const p of packages) {
    const val = execSync(`cd packages/${p} && yalc publish --push`).toString()
    console.log(`${p}: ${val}`)
  }
}

/**
 * Set up the command line tool and options.
 */
export default function () {
  const cli = cac()
  cli
    .command('[local]', 'Publishes all packages to local repository via yalc', {
      allowUnknownOptions: true,
    })
    .action(() => publishLocal())
  cli.help()
  cli.parse()
}
