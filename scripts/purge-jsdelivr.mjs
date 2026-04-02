/**
 * purge-jsdelivr.mjs
 *
 * Lightweight JSDelivr purge script for CI post-publish jobs.
 * Avoids the heavier ci-publish dependency tree so post-publish can run
 * without installing the full workspace.
 */

function parseTag(argv) {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--tag' && argv[i + 1]) return argv[i + 1]
    if (arg.startsWith('--tag=')) return arg.slice('--tag='.length)
  }
  return 'latest'
}

function purgePaths(tag) {
  return [
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
    `/npm/@formkit/react@${tag}/dist/index.mjs`,
    `/npm/@formkit/react@${tag}/dist/index.min.mjs`,
    `/npm/@formkit/vue@${tag}/dist/index.mjs`,
    `/npm/@formkit/vue@${tag}/dist/index.min.mjs`,
    `/npm/@formkit/addons@${tag}/dist/index.mjs`,
    `/npm/@formkit/addons@${tag}/dist/index.min.mjs`,
  ]
}

async function purge(tag) {
  console.log(`Clearing JSDelivr @${tag} tag`)
  try {
    const res = await fetch('https://purge.jsdelivr.net/', {
      method: 'POST',
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: purgePaths(tag),
      }),
    })

    if (!res.ok) {
      throw new Error(`JSDelivr purge failed: ${res.status} ${res.statusText}`)
    }

    const body = await res.json()
    if (body.id) {
      console.log(`Purge status: https://purge.jsdelivr.net/status/${body.id}`)
    }
    console.log('JSDelivr cache purge initiated')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`Failed to purge JSDelivr cache: ${message}`)
  }
}

await purge(parseTag(process.argv.slice(2)))
