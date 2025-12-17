/**
 * ci-publish.mjs
 *
 * CI-only publish script for GitHub Actions with npm Trusted Publishing.
 * This script is called by the publish.yml workflow after building all packages.
 *
 * Usage:
 *   node scripts/ci-publish.mjs --tag=latest                     # Publish all packages (production)
 *   node scripts/ci-publish.mjs --tag=next --version=1.7.1-next.abc123  # Publish pre-release from tag
 *   node scripts/ci-publish.mjs --purge-cdn --tag=latest         # Only purge JSDelivr cache
 *
 * For pre-release builds (next/dev), the --version flag sets all package.json versions
 * before publishing. This allows publishing from a tag without committing version changes.
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import cac from 'cac'
import axios from 'axios'
import {
  getPackages,
  getBuildOrder,
  getPackageJSON,
  writePackageJSON,
  updateFKCoreVersionExport,
  msg,
} from './utils.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const packagesDir = resolve(__dirname, '../packages')

/**
 * Verify that build output exists for a package
 */
function verifyBuildOutput(pkg) {
  const distDir = resolve(packagesDir, pkg, 'dist')
  if (!existsSync(distDir)) {
    return false
  }
  return true
}

/**
 * Check if a version is a pre-release (contains -next or -dev)
 */
function isPrerelease(version) {
  return version && (version.includes('-next') || version.includes('-dev'))
}

/**
 * Set version in all package.json files (for pre-release CI builds)
 * Also converts workspace:^ dependencies to exact versions to avoid
 * semver pre-release comparison issues (where hash sorting can pick wrong version)
 */
function setPackageVersions(version) {
  const packages = getPackages()
  msg.info(`Setting all package versions to ${version}...`)
  for (const pkg of packages) {
    try {
      const packageJSON = getPackageJSON(pkg)
      packageJSON.version = version

      // For pre-releases, convert workspace:^ to exact versions
      // This prevents semver from picking a "higher" hash that's actually older
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

      writePackageJSON(pkg, packageJSON)
    } catch (e) {
      msg.error(`Failed to update version for ${pkg}`)
      throw e
    }
  }
  msg.success('✅ Package versions updated')
}

/**
 * Main CI publish function
 */
async function ciPublish({ tag, purgeCdn, version }) {
  if (purgeCdn) {
    await purgeJSDelivrCache(tag)
    return
  }

  const packages = getPackages()
  const orderedPackages = getBuildOrder(packages)

  // Verify build output exists
  msg.info('Verifying build output...')
  const missingBuilds = orderedPackages.filter((pkg) => !verifyBuildOutput(pkg))
  if (missingBuilds.length > 0) {
    msg.error('❌ Build output missing for packages:')
    missingBuilds.forEach((pkg) => msg.error(`   - ${pkg}`))
    msg.error('\nMake sure "pnpm build" completed successfully before publishing.')
    process.exit(1)
  }
  msg.success('✅ Build output verified')

  // For pre-release versions, set package.json versions from the provided version
  // This is used when publishing from a tag where versions weren't committed
  if (version && isPrerelease(version)) {
    msg.info(`Pre-release detected: ${version}`)
    setPackageVersions(version)
  }

  // Update FORMKIT_VERSION in core dist files
  const coreDistFile = resolve(packagesDir, 'core/dist/index.mjs')
  if (existsSync(coreDistFile)) {
    const coreVersion = version || getPackageJSON('core').version
    msg.info(`Updating FORMKIT_VERSION to ${coreVersion}...`)
    updateFKCoreVersionExport(coreVersion)
    msg.success('✅ Version updated in core dist files')
  } else {
    msg.warn('⚠️ Core dist files not found, skipping version update')
  }

  msg.headline(
    `Publishing ${orderedPackages.length} packages with tag @${tag}`
  )

  for (const pkg of orderedPackages) {
    const tagStatement = tag !== 'latest' ? `--tag ${tag}` : ''
    try {
      msg.info(`Publishing @formkit/${pkg}...`)
      // Use pnpm publish to properly convert workspace:^ to real versions
      execSync(
        `pnpm publish ./packages/${pkg}/ --access public --no-git-checks ${tagStatement}`.trim(),
        {
          stdio: 'inherit',
        }
      )
      msg.success(`✅ @formkit/${pkg} published`)
    } catch (e) {
      msg.error(`❌ Failed to publish @formkit/${pkg}`)
      process.exit(1) // Fail fast
    }
  }

  msg.success('All packages published successfully!')
}

/**
 * Purge JSDelivr CDN cache for all FormKit packages
 */
async function purgeJSDelivrCache(tag) {
  msg.info(`♻️ Clearing JSDelivr @${tag} tag`)

  try {
    const res = await axios({
      method: 'POST',
      url: 'https://purge.jsdelivr.net/',
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
      },
      data: {
        path: [
          `/npm/@formkit/core@${tag}/dist/index.mjs`,
          `/npm/@formkit/core@${tag}/dist/index.min.mjs`,
          `/npm/@formkit/dev@${tag}/dist/index.mjs`,
          `/npm/@formkit/dev@${tag}/dist/index.min.mjs`,
          `/npm/@formkit/i18n@${tag}/dist/index.mjs`,
          `/npm/@formkit/i18n@${tag}/dist/index.min.mjs`,
          `/npm/@formkit/inputs@${tag}/dist/index.mjs`,
          `/npm/@formkit/inputs@${tag}/dist/index.min.mjs`,
          `/npm/@formkit/observer@${tag}/dist/index.mjs`,
          `/npm/@formkit/observer@${tag}/dist/index.min.mjs`,
          `/npm/@formkit/rules@${tag}/dist/index.mjs`,
          `/npm/@formkit/rules@${tag}/dist/index.min.mjs`,
          `/npm/@formkit/themes@${tag}/dist/index.mjs`,
          `/npm/@formkit/themes@${tag}/dist/index.min.mjs`,
          `/npm/@formkit/themes@${tag}/dist/genesis/theme.css`,
          `/npm/@formkit/themes@${tag}/dist/genesis/theme.min.css`,
          `/npm/@formkit/themes@${tag}/dist/tailwindcss/index.mjs`,
          `/npm/@formkit/themes@${tag}/dist/tailwindcss/index.min.mjs`,
          `/npm/@formkit/themes@${tag}/dist/unocss/index.mjs`,
          `/npm/@formkit/themes@${tag}/dist/unocss/index.min.mjs`,
          `/npm/@formkit/themes@${tag}/dist/windicss/index.mjs`,
          `/npm/@formkit/themes@${tag}/dist/windicss/index.min.mjs`,
          `/npm/@formkit/utils@${tag}/dist/index.mjs`,
          `/npm/@formkit/utils@${tag}/dist/index.min.mjs`,
          `/npm/@formkit/validation@${tag}/dist/index.mjs`,
          `/npm/@formkit/validation@${tag}/dist/index.min.mjs`,
          `/npm/@formkit/vue@${tag}/dist/index.mjs`,
          `/npm/@formkit/vue@${tag}/dist/index.min.mjs`,
          `/npm/@formkit/addons@${tag}/dist/index.mjs`,
          `/npm/@formkit/addons@${tag}/dist/index.min.mjs`,
        ],
      },
    })

    if (res.data.id) {
      msg.info(`Purge status: https://purge.jsdelivr.net/status/${res.data.id}`)
    }
    msg.success('JSDelivr cache purge initiated')
  } catch (e) {
    msg.error('Failed to purge JSDelivr cache')
    console.error(e.message)
    // Don't fail the build for cache purge failure
  }
}

/**
 * Set up the command line tool and options.
 */
const cli = cac('ci-publish')
cli.option('--tag <tag>', 'NPM tag to publish with', { default: 'latest' })
cli.option('--version <version>', 'Version to set in package.json files (for pre-release builds from tags)')
cli.option('--purge-cdn', 'Only purge JSDelivr cache', { default: false })
cli.command('').action((options) => ciPublish(options))
cli.help()
cli.parse()
