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

import { exec, execSync } from "child_process"
import cac from 'cac'
import prompts from 'prompts'
import chalk from 'chalk'
import {
  packagesDir,
  checkDependsOn,
  getPackages,
  getPackageFromFS,
  getPackageJSON,
  writePackageJSON,
  checkGitCleanWorkingDirectory,
  checkGitIsMasterBranch,
  getLatestPackageCommits,
  getFKDependenciesFromObj,
  getDependencyTree,
  drawDependencyTree,
  flattenDependencyTree,
  isAlphaNumericVersion,
  msg
} from './utils.mjs'
import { buildAllPackages } from './build.mjs'

const allPackages = []
let toBePublished = []
const prePublished = {}

/**
 * Main entry point to the build process
 */
async function publishPackages () {
  if (!checkGitCleanWorkingDirectory()) {
    msg.error(`⚠️   The current working directory is not clean. Please commit all changes before publishing.`)
    // return
  }
  if (!checkGitIsMasterBranch()) {
    msg.error(`⚠️   Publishing should only occur from the master branch`)
    // return
  }

  allPackages.push(...await getPackages())
  const shouldBuild = await buildAllPackagesConsent()
  if (!shouldBuild) {
    return msg.error('Publish aborted.')
  }
  msg.info('🌎 Building all packages.')
  // await buildAllPackages(allPackages)
  await getChangedDist()

  if (!toBePublished.length) return msg.error(`\nAll packages appear identical to their currently published versions. Nothing to publish... 👋\n`)

  msg.headline(`The following packages have changes when diffed with their last published version.
Any dependent packages will also require publishing to include dependency changes:`
  )
  const dependencyTree = await getDependencyTree(toBePublished, true)
  drawDependencyTree(dependencyTree)
  msg.info(`\nPackages will be published in the following order:`)
  toBePublished = await getPublishOrder(toBePublished)
  console.log(toBePublished, '\n')

  const { confirmBuild } = await prompts({
    type: 'confirm',
    name: 'confirmBuild',
    message: `Continue`,
    initial: true
  })
  if (!confirmBuild) {
    msg.error('Build aborted. 👋')
    return
  }

  for (const [i, pkg] of toBePublished.entries()) {
    await prePublishPackage(pkg, i)
  }

  msg.headline(`All packages configured. Preparing publish...`)
  msg.info(`The following changes will be commited and published.\nPlease review and confirm:\n`)
  drawPublishPreviewGraph(prePublished)

  console.log('\n\n')
  const { confirmPublish } = await prompts({
    type: 'text',
    name: 'confirmPublish',
    message: `To confirm publish please type 'booyah':`,
    validate: (msg) => {
      if (msg === 'booyah') {
        return true
      }
      return 'Invalid response. to abort press ^c...'
    }
  })
  if (!confirmPublish) return msg.error('Publish aborted. 👋')

  msg.headline('  Publishing 🚀  ')
  writePackageJSONFiles()
  console.log('\n\n')
  yarnPublishAffectedPackages()

  // signing off
  await promptForGitCommit()
  msg.headline(' 🎉   All changes published and committed!')
  drawPublishPreviewGraph(prePublished)
  console.log('\n\n')
}

/**
 * Loops through prePublish changes and writes new package.json files
 * for each affected package.
 */
function writePackageJSONFiles () {
  const packages = Object.keys(Object.assign({}, prePublished))
  while (packages.length) {
    const pkg = packages.shift()
    const packageJSON = getPackageJSON(pkg)
    packageJSON.version = prePublished[pkg].newVersion
    if (prePublished[pkg].newDependencies) {
      packageJSON.dependencies = Object.assign({}, packageJSON.dependencies, prePublished[pkg].newDependencies)
    }
    if (prePublished[pkg].newDevDependencies) {
      packageJSON.devDependencies = Object.assign({}, packageJSON.devDependencies, prePublished[pkg].newDevDependencies)
    }
    writePackageJSON(pkg, packageJSON)
    msg.info(`✅ /packages/${chalk.magenta(pkg)}/package.json updated`)
  }
}

/**
 * Loops through prePublish object and publishes packages
 */
function yarnPublishAffectedPackages () {
  const packages = Object.keys(Object.assign({}, prePublished))
  while (packages.length) {
    const pkg = packages.shift()
    const version = prePublished[pkg].newVersion
    try {
      execSync(`yarn publish --new-version ${version} ${packagesDir}/${pkg}/package.json`)
    } catch (e) {
      msg.error(`a new version of ${pkg} was not published`)
    }
  }
}

/**
 * Prompts the user for a commit message and commits all changes
 */
async function promptForGitCommit () {
  execSync(`git add .`)
  const { msg } = await prompts({
    type: 'text',
    name: 'msg',
    message: `⛓ Committing changes. Please provide a commit message: `,
  })
  execSync(`git commit -m "${msg}`)
}

/**
* Guided process for setting a new version on a package
*/
async function prePublishPackage (pkg, index) {
  const packageJSON = getPackageJSON(pkg)
  const commitNumber = 5
  const relevantCommits = getLatestPackageCommits(pkg, commitNumber)

  msg.headline(`🔧  Configuring ${pkg}...`)

  if (index > 0) {
    // check for dependencies in published object and bump version(s)
    updatePublishedDependencies(pkg)
  }

  msg.info(`Latest ${commitNumber} commits affecting files in /packages/${pkg} directory: `)
  console.log(relevantCommits)
  console.log(`The package ${chalk.cyan(pkg)} is currently on version ${chalk.cyan(packageJSON.version)}\n`)

  await setNewPackageVersion(pkg)
}

/**
 * Checks if a package has dependency versions that need to be bumped
 * as part of the publish process
 */
function updatePublishedDependencies (pkg) {
  msg.info(`Checking if ${pkg} has dependencies in need of updating...`)
  const packageJSON = getPackageJSON(pkg)
  const dependencies = packageJSON.dependencies ? getFKDependenciesFromObj(packageJSON.dependencies) : []

  for (const dep of Object.keys(prePublished)) {
    if (checkDependsOn(pkg, dep)) {
      console.log(chalk.cyan(`Package ${chalk.magenta(pkg)} has a dependency on ${chalk.magenta(dep)}
Dependency ${chalk.magenta(dep)} will be updated from ${chalk.magenta(prePublished[dep].oldVersion)} to ${chalk.magenta(prePublished[dep].newVersion)}`))
      const targetNewDepGroup = dependencies.includes(dep) ? 'newDependencies' : 'newDevDependencies'
      const targetOldDepGroup = dependencies.includes(dep) ? 'oldDependencies' : 'oldDevDependencies'
      const depName = `@formkit/${dep}`
      const newDepPayload = { [depName]: prePublished[dep].newVersion }
      const oldDepPayload = { [depName]: prePublished[dep].oldVersion }
      prePublished[pkg] = Object.assign({}, prePublished[pkg])
      // assign new dependencies
      prePublished[pkg][targetNewDepGroup] = prePublished[pkg][targetNewDepGroup] ?
        prePublished[pkg][targetNewDepGroup] = Object.assign({}, prePublished[pkg][targetNewDepGroup], newDepPayload) :
        prePublished[pkg][targetNewDepGroup] = newDepPayload
      // store old dependencies
      prePublished[pkg][targetOldDepGroup] = prePublished[pkg][targetOldDepGroup] ?
        prePublished[pkg][targetOldDepGroup] = Object.assign({}, prePublished[pkg][targetOldDepGroup], oldDepPayload) :
        prePublished[pkg][targetOldDepGroup] = oldDepPayload
    }
  }
  console.log('\n')
}

/**
 * Guided process to set a new package version
 */
async function setNewPackageVersion (pkg) {
  const packageJSON = getPackageJSON(pkg)
  const isAlphaNumericVer = isAlphaNumericVersion(packageJSON.version)
  let versionBumpType = 'patch'
  const versionTypes = ['patch', 'minor', 'major']

  if (!isAlphaNumericVer) {
    const { bumpType } = await prompts({
      type: 'select',
      name: 'bumpType',
      message: `What type of version update is this publish?`,
      choices: versionTypes.map((type) => {
        return {
          title: type,
          value: type
        }
      })
    })
    versionBumpType = bumpType
  } else {
    versionBumpType = 'alphaNumeric'
  }

  const { newPackageVersion } = await prompts({
    type: 'text',
    name: 'newPackageVersion',
    message: `What should the new version be?`,
    initial: suggestVersionIncrement(packageJSON.version, versionBumpType)
  })

  prePublished[pkg] = Object.assign({}, prePublished[pkg], {
    oldVersion: packageJSON.version,
    newVersion: newPackageVersion
  })
}

/**
 * Given a version string and a version bump type - suggest the next version
 */
function suggestVersionIncrement(version, updateType) {
  let versionParts = version.split('.')
  let targetIndex = versionParts.length - 1
  switch (updateType) {
    case 'major':
      targetIndex = 0
      break
    case 'minor':
      targetIndex = 1
      break
    default:
      targetIndex = versionParts.length - 1
      break
  }

  versionParts[targetIndex]++
  versionParts = versionParts.map((part, index) => {
    if (index > targetIndex) {
      return 0
    }
    return part
  })
  return versionParts.join('.')
}

/**
 * Confirm with user that all packages are going to be built
 */
async function buildAllPackagesConsent () {
  const { shouldBuild } = await prompts({
    type: 'confirm',
    name: 'shouldBuild',
    message: `Publishing will generate clean builds of ${chalk.red('ALL')} packages. Continue?`,
    initial: true
  })
  return shouldBuild
}

/**
 * Checks each package to see if the dist directory is different
 * than the currently published NPM module
 */
async function getChangedDist () {
  for (const p of allPackages) {
    // TODO: compare against NPM published data
    // for now just say that only core is unchanged.
    // When NPM is available, only compare .esm.js and .d.ts files
    if (p !== '') {
      toBePublished.push(p)
    }
  }
}

/**
 * Given a list of packages, determine the correct order to publish them
 * so that upgraded dependencies become included within their dependents
 */
async function getPublishOrder (packages) {
  const dependentsTree = await getDependencyTree(packages, true)
  return await flattenDependencyTree(dependentsTree)
}

/**
 * Given a list of changed packages (prePublish) generate a tree view
 * that shows all applied changes
 */
function drawPublishPreviewGraph (packages) {
  for (const [title, pkg] of Object.entries(packages)) {
    console.log(`${title}: ` + chalk.red(pkg.oldVersion) + ' -> ' + chalk.green(pkg.newVersion))

    if (pkg.newDependencies) {
      console.log(chalk.dim(`  ∟ dependencies:`))
      for (const [depTitle, dep] of Object.entries(pkg.newDependencies)) {
        console.log(chalk.dim(`    ∟ ${depTitle}: `) + chalk.red.dim(pkg.oldDependencies[depTitle]) + ' -> ' + chalk.green.dim(pkg.newDependencies[depTitle]))
      }
    }
    if (pkg.newDevDependencies) {
      console.log(chalk.dim(`  ∟ devDependencies:`))
      for (const [depTitle, dep] of Object.entries(pkg.newDevDependencies)) {
        console.log(chalk.dim(`    ∟ ${depTitle}: `) + chalk.red.dim(pkg.oldDevDependencies[depTitle]) + ' -> ' + chalk.green.dim(pkg.newDevDependencies[depTitle]))
      }
    }
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
