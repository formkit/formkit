/**
 * ci-prepare-publish.mjs
 *
 * Prepares built FormKit packages for CI publishing by verifying build output,
 * syncing package versions to the workflow version, and updating the core
 * version export placeholder in built artifacts.
 */

import { existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import cac from 'cac'
import {
  getPackages,
  getPackageJSON,
  writePackageJSON,
  updateFKCoreVersionExport,
  msg,
} from './utils.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const packagesDir = resolve(__dirname, '../packages')

function inferTagFromVersion(version) {
  if (!version) return 'latest'
  if (/(^|[-.])next([.-]|$)/.test(version)) return 'next'
  if (/(^|[-.])dev([.-]|$)/.test(version)) return 'dev'
  return 'latest'
}

function verifyBuildOutput(pkg) {
  return existsSync(resolve(packagesDir, pkg, 'dist'))
}

function setPackageVersions(version, exactWorkspaceDeps = false) {
  const packages = getPackages()
  msg.info(`Setting all package versions to ${version}...`)
  for (const pkg of packages) {
    const packageJSON = getPackageJSON(pkg)
    packageJSON.version = version

    if (exactWorkspaceDeps) {
      if (packageJSON.dependencies) {
        for (const dep of Object.keys(packageJSON.dependencies)) {
          if (dep.startsWith('@formkit/') && packageJSON.dependencies[dep] === 'workspace:^') {
            packageJSON.dependencies[dep] = `workspace:${version}`
          }
        }
      }
      if (packageJSON.devDependencies) {
        for (const dep of Object.keys(packageJSON.devDependencies)) {
          if (dep.startsWith('@formkit/') && packageJSON.devDependencies[dep] === 'workspace:^') {
            packageJSON.devDependencies[dep] = `workspace:${version}`
          }
        }
      }
    }

    writePackageJSON(pkg, packageJSON)
  }
  msg.success('✅ Package versions updated')
}

function preparePublish(version) {
  msg.info('Verifying build output...')
  const packages = getPackages()
  const missingBuilds = packages.filter((pkg) => !verifyBuildOutput(pkg))
  if (missingBuilds.length) {
    msg.error('❌ Build output missing for packages:')
    missingBuilds.forEach((pkg) => msg.error(`   - ${pkg}`))
    process.exit(1)
  }
  msg.success('✅ Build output verified')

  const tag = inferTagFromVersion(version)
  const exactWorkspaceDeps = tag !== 'latest'
  setPackageVersions(version, exactWorkspaceDeps)

  msg.info(`Updating FORMKIT_VERSION to ${version}...`)
  updateFKCoreVersionExport(version)
  msg.success('✅ Version updated in core dist files')
}

const cli = cac('ci-prepare-publish')
cli.option('--version <version>', 'Version to apply to built packages')
cli.command('').action((options) => {
  if (!options.version) {
    msg.error('A --version value is required.')
    process.exit(1)
  }
  preparePublish(options.version)
})
cli.help()
cli.parse()
