
/**
 * publish.mjs
 *
 * This publish script is responsible for publishing all of the
 * packages in this FormKit monorepo and helping the publisher assign
 * proper semantic versioning numbers to the built assets.
 * The essential steps of this build are:
 * - Run build.mjs
 * - Compare built .esm and .tsd files to latest published versions
 * - Assigning new version numbers to changed packages
 * - Determining which packages depend on the newly built package
 * - Assigning new version numbers to packages affected by version bumps
 * - Recursively repeat above steps until no more packages are affected
 * - Present a overview of all changes represented by the publish action
 * - - For each changed package get the github commit range from the last published commit hash to now
 * - - Display only commits that affected files it the current package's directory
 * - Publish (or cancel) all changes to affected packages
*/

// import cac from 'cac'
// import prompts from 'prompts'
// import fs from 'fs/promises'
// import execa from 'execa'
// import { dirname, resolve } from 'path'
// import { fileURLToPath } from 'url'
// import {
//   getPackages,
//   getBuildOrder,
//   msg
// } from './utils.mjs'

// const __filename = fileURLToPath(import.meta.url)
// const __dirname = dirname(__filename)
// const rootDir = resolve(__dirname, '../')
// const packagesDir = resolve(__dirname, '../packages')
// const rollup = `${rootDir}/node_modules/.bin/rollup`

