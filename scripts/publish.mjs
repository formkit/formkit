/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

/**
 * publish.mjs
 *
 * This publish script is responsible for preparing all packages in the FormKit
 * monorepo for publishing via CI. It helps the publisher assign proper semantic
 * versioning numbers to the built assets.
 *
 * The essential steps of this build are:
 * - Get permission from user to build ALL packages
 * - Show user packages that have changed / will be affected by dependency changes
 * - Prompt new version numbers to changed packages
 * - Present an overview of all changes represented by the publish action
 * - Write version bumps to package.json files
 * - Commit changes and create a git tag
 * - Push to remote - CI handles the actual npm publish
 *
 * For the legacy publish script that publishes directly, see publish-legacy.mjs
 */

import { execSync } from 'child_process'
import cac from 'cac'
import prompts from 'prompts'
import chalk from 'chalk'
import {
  getPackages,
  getPackageJSON,
  writePackageJSON,
  checkGitCleanWorkingDirectory,
  checkGitIsMasterBranch,
  getLatestPackageCommits,
  getDependencyTree,
  drawDependencyTree,
  flattenDependencyTree,
  isAlphaNumericVersion,
  msg,
  getCurrentHash,
  updateFKCoreVersionExport,
} from './utils.mjs'
import { buildAllPackages } from './build.mjs'

const allPackages = []
let toBePublished = []
const prePublished = {}
let versionSuffix = false // 'next' or 'dev' for non-master branches
let isMasterBranch = false

/**
 * Validates that the version is appropriate for the current branch.
 * - Master branch: must NOT have -next or -dev suffix
 * - Non-master branch: MUST have -next or -dev suffix
 */
function validateVersionForBranch(version) {
  const isPrerelease = version.includes('-next') || version.includes('-dev')

  if (isMasterBranch && isPrerelease) {
    msg.error(
      '❌ Cannot use pre-release version suffix (-next/-dev) from master branch.'
    )
    msg.info('Pre-release versions can only be published from feature branches.')
    return false
  }

  if (!isMasterBranch && !isPrerelease) {
    msg.error(
      '❌ Non-master branches must use -next or -dev version suffix.'
    )
    msg.info(
      'This ensures @latest releases only come from the master branch.'
    )
    return false
  }

  return true
}

/**
 * Creates a git tag and pushes to remote, triggering CI publish.
 */
async function createAndPushTag(version, dryRun = false) {
  const tagName = `v${version}`

  if (dryRun) {
    msg.info(`\n[DRY RUN] Would create tag: ${chalk.cyan(tagName)}`)
    msg.info(`[DRY RUN] Would push commit to remote`)
    msg.info(`[DRY RUN] Would push tag to remote`)
    msg.info(`\n[DRY RUN] CI would then publish with npm tag: ${chalk.cyan(versionSuffix || 'latest')}`)
    return true
  }

  try {
    msg.info('» Staging and committing changed files...')
    execSync('git add .')
    execSync(`git commit -m "chore: release ${tagName}"`)

    msg.info(`» Creating tag ${chalk.cyan(tagName)}...`)
    execSync(`git tag ${tagName}`)

    msg.info('» Pushing commit to remote...')
    execSync('git push origin HEAD')

    msg.info('» Pushing tag to remote...')
    execSync(`git push origin ${tagName}`)

    msg.success(`\n✅ Tag ${chalk.cyan(tagName)} created and pushed!`)
    msg.info('🚀 CI will now handle building and publishing to npm.')

    const npmTag = versionSuffix || 'latest'
    msg.info(`   NPM tag: @${npmTag}`)

    return true
  } catch (e) {
    msg.error('Failed to create/push tag')
    console.error(e.message)
    return false
  }
}

/**
 * Main entry point to the build process
 */
async function publishPackages({ force, skipClean, dryRun }) {
  if (!/pnpm\.cjs$/.test(process.env.npm_execpath)) {
    msg.error(`⚠️ You must run this command with pnpm instead of npm or yarn.`)
    msg.info('Please try again with:\n\n» pnpm run publish\n\n')
    return
  }

  if (!skipClean && !checkGitCleanWorkingDirectory()) {
    msg.error(
      `⚠️   The current working directory is not clean. Please commit all changes before publishing.`
    )
    return
  }

  isMasterBranch = checkGitIsMasterBranch()

  if (!isMasterBranch) {
    const { confirmSuffix } = await prompts({
      type: 'select',
      name: 'confirmSuffix',
      message: `⚠️  Not on master branch! Which version suffix would you like to use?`,
      choices: [
        {
          title: '-next (pre-release)',
          description: 'For testing upcoming features',
          value: 'next',
        },
        {
          title: '-dev (development)',
          description: 'For development/experimental builds',
          value: 'dev',
        },
        {
          title: 'CANCEL',
          value: false,
        },
      ],
    })
    versionSuffix = confirmSuffix
    if (versionSuffix) {
      msg.info(`Version suffix set to: -${confirmSuffix}`)
      msg.info(`Packages will be published with @${confirmSuffix} npm tag`)
    } else {
      msg.error('✋ Publish cancelled')
      return
    }
  }

  allPackages.push(...(await getPackages()))
  const shouldBuild = await buildAllPackagesConsent()

  if (!shouldBuild) {
    return msg.error('Publish aborted.')
  }
  if (shouldBuild === 'all') {
    msg.info('🌎 Building all packages.')
    await buildAllPackages(allPackages)
  } else {
    msg.info('💨 Skipping build step.')
  }
  await getChangedDist()

  if (!toBePublished.length && !force && !versionSuffix)
    return msg.error(
      `\nAll packages appear identical to their currently published versions. Nothing to publish... 👋\n`
    )

  msg.headline(`The following packages have changes when diffed with their last published version.
Any dependent packages will also require publishing to include dependency changes:`)
  const dependencyTree = await getDependencyTree(toBePublished, true)
  drawDependencyTree(dependencyTree)
  msg.info(`\nPackages will be published in the following order:`)
  toBePublished = await getPublishOrder(toBePublished)
  console.log(toBePublished, '\n')

  if (!versionSuffix) {
    const { confirmBuild } = await prompts({
      type: 'confirm',
      name: 'confirmBuild',
      message: `Continue`,
      initial: true,
    })
    if (!confirmBuild) {
      msg.error('Build aborted. 👋')
      return
    }
  }

  let forceVersion = false
  if (versionSuffix) {
    forceVersion = await promptForTaggedVersion()
    msg.info(
      `All packages will be set to version ${forceVersion}`
    )
  }

  for (const [i, pkg] of toBePublished.entries()) {
    await prePublishPackage(pkg, i, forceVersion)
  }

  // Validate versions before proceeding
  const sampleVersion = prePublished[Object.keys(prePublished)[0]]?.newVersion
  if (sampleVersion && !validateVersionForBranch(sampleVersion)) {
    return msg.error('Publish aborted due to version/branch mismatch. 👋')
  }

  msg.headline(`All packages configured. Preparing to tag and push...`)
  msg.info(
    `The following changes will be committed and tagged.\nPlease review and confirm:\n`
  )
  drawPublishPreviewGraph(prePublished)

  console.log('\n\n')

  if (dryRun) {
    msg.warn('🔍 DRY RUN MODE - No changes will be made')
  }

  const { confirmPublish } = await prompts({
    type: 'text',
    name: 'confirmPublish',
    message: `To confirm${dryRun ? ' (dry run)' : ''} please type 'booyah':`,
    validate: (msg) => {
      if (msg === 'booyah') {
        return true
      }
      return 'Invalid response. to abort press ^c...'
    },
  })
  if (!confirmPublish && !force) return msg.error('Publish aborted. 👋')

  msg.headline('  Preparing Release 🚀  ')
  const didWrite = writePackageJSONFiles()

  if (!didWrite && !force) return msg.error('Publish aborted. 👋')

  // Update lockfile to match new package.json versions
  msg.info('» Updating pnpm-lock.yaml...')
  try {
    execSync('pnpm install --no-frozen-lockfile', { stdio: 'inherit' })
    msg.success('✅ Lockfile updated')
  } catch (e) {
    msg.error('Failed to update lockfile')
    console.error(e.message)
    await restoredPackageJSONFiles()
    // Clean up pre-release versions even on failure
    if (versionSuffix) {
      msg.info('\n» Cleaning up local package versions...')
      cleanupPackageVersions()
    }
    return msg.error('Publish aborted. 👋')
  }

  // if core is being published, then update the FORMKIT_VERSION export
  // to match the newly set version number
  if (prePublished.core) {
    updateFKCoreVersionExport(prePublished.core.newVersion)
  }
  console.log('\n\n')

  // Get the version for the tag (use core's version as the tag)
  const releaseVersion = prePublished.core?.newVersion || prePublished[Object.keys(prePublished)[0]]?.newVersion

  if (!releaseVersion) {
    return msg.error('Could not determine release version. 👋')
  }

  const didTag = await createAndPushTag(releaseVersion, dryRun)

  if (!didTag && !force) {
    // Restore package.json files if tag creation failed
    await restoredPackageJSONFiles()
    // Clean up pre-release versions even on failure
    if (versionSuffix) {
      msg.info('\n» Cleaning up local package versions...')
      cleanupPackageVersions()
    }
    return msg.error('Publish aborted. 👋')
  }

  if (dryRun) {
    msg.info('\n🔍 Dry run complete. Restoring package.json files...')
    await restoredPackageJSONFiles()
    // Clean up pre-release versions after dry run
    if (versionSuffix) {
      msg.info('\n» Cleaning up local package versions...')
      cleanupPackageVersions()
    }
  }

  msg.headline(' 🎉   Release prepared and pushed!')
  msg.info('Monitor the GitHub Actions workflow for publish status.')

  // Clean up local package versions by stripping pre-release suffix
  if (versionSuffix) {
    msg.info('\n» Cleaning up local package versions...')
    cleanupPackageVersions()
    msg.success('✅ Local package.json versions cleaned (pre-release suffix removed)')
  }

  console.log('\n\n')
}

async function promptForTaggedVersion() {
  msg.info('Pre-release versions should include the commit hash!')
  const hash = getCurrentHash()
  const packageJSON = getPackageJSON('core')
  const guessVersion = suggestVersionIncrement(packageJSON.version, 'minor')
  const { version } = await prompts({
    type: 'text',
    name: 'version',
    message: `Including the suffix (hash: ${hash}), please enter the full version name.`,
    initial: `${guessVersion}-${versionSuffix}.${hash}`,
  })
  return version
}

/**
 * Loops through prePublish changes and writes new package.json files
 * for each affected package.
 */
function writePackageJSONFiles() {
  const packages = Object.keys(Object.assign({}, prePublished))
  let didWrite = true
  while (packages.length) {
    const pkg = packages.shift()
    const packageJSON = getPackageJSON(pkg)
    packageJSON.version = prePublished[pkg].newVersion
    // Note: Dependencies use workspace:^ protocol, so pnpm will automatically
    // convert them to real versions at publish time. No manual sync needed.
    try {
      writePackageJSON(pkg, packageJSON)
      msg.info(`✅ /packages/${chalk.magenta(pkg)}/package.json updated`)
    } catch (e) {
      console.log(e)
      didWrite = false
      msg.error(`There was a problem writing the package.json for ${pkg}`)
    }
  }
  return didWrite
}

/**
 * Restore the package.json files to the original version.
 */
function restoredPackageJSONFiles() {
  execSync('git reset HEAD --hard')
}

/**
 * Strip pre-release suffix from all package versions.
 * Converts versions like "1.7.0-next.5c0925c" to "1.7.0"
 * This keeps local package.json files clean after a release.
 */
function cleanupPackageVersions() {
  const packages = getPackages()
  for (const pkg of packages) {
    try {
      const packageJSON = getPackageJSON(pkg)
      const currentVersion = packageJSON.version
      const cleanVersion = currentVersion.split('-')[0]
      if (cleanVersion !== currentVersion) {
        packageJSON.version = cleanVersion
        writePackageJSON(pkg, packageJSON)
        msg.info(`Cleaned ${pkg}: ${currentVersion} → ${cleanVersion}`)
      }
    } catch (e) {
      // Skip packages that don't have a valid package.json
    }
  }
}

/**
 * Guided process for setting a new version on a package
 */
async function prePublishPackage(pkg, index, forceVersion = false) {
  const packageJSON = getPackageJSON(pkg)
  const commitNumber = 5
  const relevantCommits = getLatestPackageCommits(pkg, commitNumber)

  msg.headline(`🔧  Configuring ${pkg}...`)

  msg.info(
    `Latest ${commitNumber} commits affecting files in /packages/${pkg} directory: `
  )
  console.log(relevantCommits)
  console.log(
    `The package ${chalk.cyan(pkg)} is currently on version ${chalk.cyan(
      packageJSON.version
    )}\n`
  )

  await setNewPackageVersion(pkg, forceVersion)
}

/**
 * Guided process to set a new package version
 */
async function setNewPackageVersion(pkg, forceVersion = false) {
  const packageJSON = getPackageJSON(pkg)
  const isAlphaNumericVer = isAlphaNumericVersion(packageJSON.version)
  let versionBumpType = 'patch'
  const versionTypes = ['patch', 'minor', 'major']
  let newPackageVersion = false

  // If the version is forced, skip this step
  if (!forceVersion) {
    if (!isAlphaNumericVer) {
      const { bumpType } = await prompts({
        type: 'select',
        name: 'bumpType',
        message: `What type of version update is this publish?`,
        choices: versionTypes.map((type) => {
          return {
            title: type,
            value: type,
          }
        }),
      })
      versionBumpType = bumpType
    } else {
      versionBumpType = 'alphaNumeric'
    }

    const result = await prompts({
      type: 'text',
      name: 'newPackageVersion',
      message: `What should the new version be?`,
      initial: suggestVersionIncrement(packageJSON.version, versionBumpType),
    })
    newPackageVersion = result.newPackageVersion
  } else {
    newPackageVersion = forceVersion
  }

  prePublished[pkg] = Object.assign({}, prePublished[pkg], {
    oldVersion: packageJSON.version,
    newVersion: newPackageVersion,
  })
}

/**
 * Given a version string and a version bump type - suggest the next version
 */
function suggestVersionIncrement(version, updateType) {
  // Strip any existing pre-release suffix for base version calculation
  const baseVersion = version.split('-')[0]
  let versionParts = baseVersion.split('.')
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
async function buildAllPackagesConsent() {
  if (versionSuffix) {
    const { value } = await prompts({
      type: 'select',
      name: 'value',
      message: 'Select build type',
      choices: [
        {
          title: 'All',
          description: 'Build all packages before publishing',
          value: 'all',
        },
        {
          title: 'Skip',
          description: 'Skip building packages and publish what is in dist',
          value: 'skip',
        },
        { title: 'Abort', value: 'false' },
      ],
      initial: 1,
    })
    if (value === 'false') return false
    return value
  } else {
    const { shouldBuild } = await prompts({
      type: 'confirm',
      name: 'shouldBuild',
      message: `Publishing will generate clean builds of ${chalk.red(
        'ALL'
      )} packages. Continue?`,
      initial: true,
    })
    return shouldBuild ? 'all' : false
  }
}

/**
 * Checks each package to see if the dist directory is different
 * than the currently published NPM module
 */
async function getChangedDist() {
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
async function getPublishOrder(packages) {
  const dependentsTree = await getDependencyTree(packages, true)
  return await flattenDependencyTree(dependentsTree)
}

/**
 * Given a list of changed packages (prePublish) generate a tree view
 * that shows all applied changes
 */
function drawPublishPreviewGraph(packages) {
  for (const [title, pkg] of Object.entries(packages)) {
    console.log(
      `${title}: ` +
        chalk.red(pkg.oldVersion) +
        ' -> ' +
        chalk.green(pkg.newVersion)
    )
  }
}

/**
 * Set up the command line tool and options.
 */
export default function () {
  const cli = cac()
  cli.option('--force', 'Bypass failure on error', {
    default: false,
  })
  cli.option('--skipClean', 'Skip checking if git is clean.', {
    default: false,
  })
  cli.option('--dry-run', 'Preview changes without pushing to remote', {
    default: false,
  })
  cli
    .command(
      '[publish]',
      'Prepares packages for publishing and pushes a release tag to trigger CI',
      { allowUnknownOptions: true }
    )
    .action((dir, options) => {
      publishPackages(options)
    })
  cli.help()
  cli.parse()
}
