/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

/**
 * publish.mjs
 *
 * This publish script is responsible for publishing all of the
 * packages in this FormKit monorepo and helping the publisher assign
 * proper semantic versioning numbers to the built assets.
 * The essential steps of this build are:
 * - Prompt that all packages that need new builds should be manually built
 * - Compare built .esm and .tsd files to latest published versions from NPM
 * - Prompt new version numbers to changed packages
 * - - For each changed package get the github commit range from the last published commit hash to now
 * - - Display only commits that affected files it the current package's directory
 * - Determining which packages depend on the newly built package
 * - Prompt for new version numbers to packages affected by version bumps
 * - Recursively repeat above steps until no more packages are affected
 * - Present a overview of all changes represented by the publish action and their final version bumps
 * - Publish (or cancel) all changes to affected packages
*/

import cac from 'cac'
import prompts from 'prompts'
// import fs from 'fs/promises'
// import execa from 'execa'
// import { dirname, resolve } from 'path'
// import { fileURLToPath } from 'url'
import {
  getPackages,
  // getBuildOrder,
  // msg
} from './utils.mjs'
import { buildAllPackages } from './build.mjs'

// const __filename = fileURLToPath(import.meta.url)
// const __dirname = dirname(__filename)
// const rootDir = resolve(__dirname, '../')
// const packagesDir = resolve(__dirname, '../packages')
// const rollup = `${rootDir}/node_modules/.bin/rollup`


async function publishPackages () {
  const { hasBuilt } = await prompts({
    type: 'confirm',
    name: 'hasBuilt',
    message: 'Have you already built the packages you would like to publish?'
  })
  if (!hasBuilt) buildSelectedPackages()
}

async function buildSelectedPackages (packages = []) {
  if (!packages.length) {
    const packageList = getPackages()
    const { packagesToBuild } = await prompts({
      type: 'multiselect',
      name: 'packagesToBuild',
      message: 'Choose packages to build before publish:',
      choices: packageList.map(name => ({
        title: name,
        value: name
      }))
    })
    packages = packagesToBuild
  }
  if (packages.length) {
    await buildAllPackages(packages)
  }
}

/**
 * Set up the command line tool and options.
 */
export default function () {
  const cli = cac();
  cli.command(
    '[publish]',
    'Walks through publishing changed packages with proper versioning',
    { allowUnknownOptions: true }
  )
  .action(publishPackages);

  cli.help();
  cli.parse();
}
