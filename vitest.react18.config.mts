/**
 * Runs the @formkit/react test suite against React 18. The peer range is
 * ^18 || ^19 and React 18 StrictMode behaves differently from 19 (it re-runs
 * the mount render with fresh hooks), see #1776.
 *
 * React 18 lives in an isolated install so react-dom's own `require('react')`
 * also resolves to React 18:
 *
 *   npm install --prefix .tests/react18
 *   npx vitest run -c vitest.react18.config.mts
 */
import { defineConfig, mergeConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import base from './vitest.config.mts'

const fixture = fileURLToPath(
  new URL('./.tests/react18/node_modules/', import.meta.url)
)

export default mergeConfig(
  base,
  defineConfig({
    resolve: {
      alias: [
        { find: /^react$/, replacement: `${fixture}react/index.js` },
        { find: /^react\/(.*)$/, replacement: `${fixture}react/$1` },
        { find: /^react-dom$/, replacement: `${fixture}react-dom/index.js` },
        { find: /^react-dom\/(.*)$/, replacement: `${fixture}react-dom/$1` },
        {
          find: /^@testing-library\/react$/,
          replacement: `${fixture}@testing-library/react/dist/index.js`,
        },
      ],
    },
    test: {
      include: ['packages/react/__tests__/**/*.spec.ts'],
    },
  })
)
