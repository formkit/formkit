/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

/**
 * publish.mjs
 *
 * This publish script is responsible for publishing all of the
 * packages in this FormKit monorepo and helping the publisher assign
 * proper semantic versioning numbers to the built assets.
 * The essential steps of this build are:
 * - Prompt the user for any packages that need to be built before publish
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
  getDependencyTree,
  drawDependencyTree,
  msg
} from './utils.mjs'
import { buildAllPackages } from './build.mjs'
import { getBuildOrder } from './utils.mjs'

// const __filename = fileURLToPath(import.meta.url)
// const __dirname = dirname(__filename)
// const rootDir = resolve(__dirname, '../')
// const packagesDir = resolve(__dirname, '../packages')
// const rollup = `${rootDir}/node_modules/.bin/rollup`

/**
 * Main entry point to the build process
 */
async function publishPackages () {
  await confirmBuildStatus()
  const packages = getBuildOrder(await getPackagesToPublish())
  if (!packages || !packages.length) return
  const dependentTree = await getDependencyTree(packages, true)
  msg.label('Dependent tree:')
  drawDependencyTree(dependentTree)
}

/**
 * Confirm with user that all target packages are built
 */
async function confirmBuildStatus () {
  const { hasBuilt } = await prompts({
    type: 'confirm',
    name: 'hasBuilt',
    message: 'Have you already built the packages you would like to publish?'
  })
  if (!hasBuilt) await buildSelectedPackages()
  return
}

/**
 * Runs builds when given an array of package names
 */
async function buildSelectedPackages (packages = []) {
  if (!packages.length) {
    const packageList = getPackages()
    const { packagesToBuild } = await prompts({
      type: 'multiselect',
      name: 'packagesToBuild',
      message: 'Choose package(s) to build before publishing:',
      choices: packageList.map(name => ({
        title: name,
        value: name
      })),
      instructions: false
    })
    packages = packagesToBuild
  }
  if (packages.length) {
    await buildAllPackages(packages)
  }
}

/**
 * Get a list of packages to publish from the user
 */
async function getPackagesToPublish () {
  const packageList = getPackages()
  const { packagesToPublish } = await prompts({
    type: 'multiselect',
    name: 'packagesToPublish',
    message: 'Which package(s) would you like to publish:',
    choices: packageList.map(name => ({
      title: name,
      value: name
    })),
    instructions: false
  })
  return packagesToPublish
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
