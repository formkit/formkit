/**
 * ci-publish.mjs
 *
 * CI-only publish script for GitHub Actions with npm Trusted Publishing.
 * This script is called by the publish.yml workflow after building all packages.
 *
 * Usage:
 *   node scripts/ci-publish.mjs --tag=latest    # Publish all packages
 *   node scripts/ci-publish.mjs --purge-cdn --tag=latest  # Only purge JSDelivr cache
 */

import { execSync } from 'child_process'
import cac from 'cac'
import axios from 'axios'
import {
  getPackages,
  getBuildOrder,
  getPackageJSON,
  updateFKCoreVersionExport,
  msg,
} from './utils.mjs'

/**
 * Main CI publish function
 */
async function ciPublish({ tag, purgeCdn }) {
  if (purgeCdn) {
    await purgeJSDelivrCache(tag)
    return
  }

  const packages = getPackages()
  const orderedPackages = getBuildOrder(packages)

  // Update FORMKIT_VERSION in core dist files
  const coreVersion = getPackageJSON('core').version
  updateFKCoreVersionExport(coreVersion)

  msg.headline(
    `Publishing ${orderedPackages.length} packages with tag @${tag}`
  )

  for (const pkg of orderedPackages) {
    const tagStatement = tag !== 'latest' ? `--tag=${tag}` : ''
    try {
      msg.info(`Publishing @formkit/${pkg}...`)
      execSync(
        `npm publish ./packages/${pkg}/ --access public ${tagStatement}`.trim(),
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
cli.option('--purge-cdn', 'Only purge JSDelivr cache', { default: false })
cli.command('').action((options) => ciPublish(options))
cli.help()
cli.parse()
