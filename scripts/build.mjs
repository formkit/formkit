/* @ts-check */

/**
 * build.mjs
 *
 * This build script is responsible for building all of the
 * packages in this formkit monorepo. The essential steps of
 * this build are:
 * - Select the package to build
 * - Clean the dist directory
 * - Bundle the package in all distribution formats
 * - Output all type declarations
 * - Rollup type declarations
 * - Clean up remove unnecessary type declarations
 * - Minify code using terser
 */
import cac from 'cac'
import prompts from 'prompts'
import fs from 'fs/promises'
import { execa } from 'execa'
import path, { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'
import {
  getPackages,
  getIcons,
  getBuildOrder,
  msg,
  getInputs,
} from './utils.mjs'
import { exec } from 'child_process'
import { createBundle } from './bundle.mjs'
import { ProgressBar } from '@opentf/cli-pbar'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, '../')
const packagesDir = resolve(__dirname, '../packages')

let isBuilding = false
let buildAll = false
let startTime = 0
/**
 * {typeof import('cli-progress').SingleBar}
 */
let progressBar
let usingProgressBar = false

export const progress = {
  expectedLogs: 0,
  logs: [],
  warnings: {},
  timeElapsed: 0,
  step: '',
}

// For Multi-step plugin
const multiStepFile = readFileSync(
  resolve(
    rootDir,
    'packages/addons/src/plugins/multiStep',
    'multiStepPlugin.ts'
  ),
  'utf8'
)
const matches = multiStepFile.match(
  /\/\* <declare> \*\/(.*?)\/\* <\/declare> \*\//gmsu
)
if (matches.length !== 2) {
  process.exit()
}

/**
 * Prompt a user to select a package.
 */
async function selectPackage() {
  const packages = getPackages()
  packages.unshift('🌎 build all')
  packages.push('🧨 cancel')
  const { selection } = await prompts({
    type: 'select',
    name: 'selection',
    message: 'Which FormKit package do you want to build?',
    choices: packages.map((name) => ({
      title: name,
      value: name,
    })),
  })
  await buildPackage(selection)
}

/**
 * Build the selected package.
 * @param p package name
 * @returns
 */
export async function buildPackage(p) {
  if (p && p !== 'all' && !isBuilding) {
    try {
      progressBar = new ProgressBar({ autoClear: true })
      progressBar.start({ total: progress.expectedLogs })
      usingProgressBar = true
    } catch {
      usingProgressBar = false
    }
    startTimer()
    isBuilding = true
  }
  const packages = getPackages()
  if (!p) {
    return selectPackage()
  }
  if (p.includes('cancel')) {
    msg.error(`The build was cancelled. 👋`)
    return
  }
  if (p.includes('build all') || p === 'all') {
    buildAllPackages(packages)
    return
  } else if (!startTime) {
    progress.expectedLogs = estimatedLogs(p)
    startTime = performance.now()
  }
  if (!packages.includes(p)) {
    msg.error(`${p} is not an valid package name.`)
  }

  if (p === 'nuxt') {
    await buildNuxtModule()
  } else {
    await bundle(p, undefined, !usingProgressBar)
  }
  if (p === 'themes') await themesBuildExtras()

  if (p === 'inputs') await inputsBuildExtras()

  if (p === 'addons') await addonsBuildExtras()

  // // special case for Icons package
  if (p === 'icons') {
    const icons = getIcons()
    await fs.mkdir(
      resolve(packagesDir, 'icons/dist/icons'),
      { recursive: true },
      (err) => {
        if (err) throw err
      }
    )
    Object.keys(icons).forEach(async (icon) => {
      await fs.writeFile(
        resolve(packagesDir, 'icons/dist/icons', `${icon}.svg`),
        icons[icon]
      )
    })
  }

  if (!buildAll) {
    buildComplete()
  }
}

/**
 * Loops through all packages and builds them in correct order
 */
export async function buildAllPackages(packages) {
  const orderedPackages = getBuildOrder(packages)
  orderedPackages.forEach((p) => {
    progress.expectedLogs += estimatedLogs(p)
  })
  buildAll = true
  startTime = performance.now()
  for (const [i, p] of orderedPackages.entries()) {
    progress.step = `Building ${i + 1}/${orderedPackages.length}: @formkit/${p}`
    await buildPackage(p)
  }
  msg.loader.stop()
  buildComplete()
}

/**
 * Output a typescript input file for each `type` key.
 */
export async function inputsBuildExtras() {
  progress.step = 'Exporting inputs by type'
  const inputs = getInputs()
  const distDir = resolve(packagesDir, 'inputs/dist/exports')
  await fs.mkdir(distDir, { recursive: true })
  await Promise.all(
    inputs.map(async (input) => {
      // await execa('cp', [input.filePath, resolve(distDir, `${input.name}.ts`)])
      let fileData = await fs.readFile(input.filePath, { encoding: 'utf8' })
      fileData = fileData.replace(
        "} from '../compose'",
        "} from '../index.mjs'"
      )
      await fs.writeFile(resolve(distDir, `${input.name}.ts`), fileData)
    })
  )
  const tsconfig = resolve(distDir, 'tsconfig.json')

  const tsConfigStr = await fs.readFile(
    resolve(rootDir, 'tsconfig.json'),
    'utf-8'
  )

  const tsData = JSON.parse(
    tsConfigStr.replace(
      './types/globals.d.ts',
      resolve(rootDir, './types/globals.d.ts').split(path.sep).join(path.posix.sep)
    )
  )
  tsData.compilerOptions.outDir = './'
  await fs.writeFile(tsconfig, JSON.stringify(tsData, null, 2))
  await execa('npx', ['tsc', '--project', tsconfig])
  await execa('npx', [
    'prettier',
    '--no-semi',
    '--single-quote',
    '--write',
    resolve(distDir, '*.js'),
  ])
  await fs.unlink(tsconfig)
}

/**
 * Special considerations for building the themes package.
 */
async function themesBuildExtras() {
  await bundle('themes', 'css/genesis', !usingProgressBar)
  await bundle('themes', 'tailwindcss', !usingProgressBar)
  await bundle('themes', 'tailwindcss/genesis', !usingProgressBar)
  await bundle('themes', 'unocss', !usingProgressBar)
  await bundle('themes', 'windicss', !usingProgressBar)
}

/**
 * Special considerations for building the addons package.
 */
async function addonsBuildExtras() {
  const addonsCSS = await fs.readdir(resolve(packagesDir, 'addons/src/css'))
  await fs.mkdir(
    resolve(packagesDir, 'addons/dist/css'),
    { recursive: true },
    (err) => {
      if (err) throw err
    }
  )
  addonsCSS.forEach(async (css) => {
    await fs.copyFile(
      resolve(packagesDir, 'addons/src/css/', css),
      resolve(packagesDir, 'addons/dist/css/', css)
    )
  })
}

/**
 * Create a new bundle of a certain format for a certain package.
 * @param p package name
 * @param format the format to create (cjs, esm, umd, etc...)
 */
async function bundle(p, subPackage, showLogs = false) {
  if (subPackage && p === 'themes') {
    progress.step = `Bundling theme ${subPackage}`
  } else if (subPackage) {
    progress.step = `Bundling plugin ${subPackage}`
  } else {
    progress.step = `Bundling ${p}${subPackage ? ' (' + subPackage + ')' : ''}`
  }
  await createBundle(p, subPackage, showLogs)
}

async function buildNuxtModule() {
  progress.step = `Bundling Nuxt module`
  return new Promise((resolve, reject) => {
    exec(
      'cd ./packages/nuxt && pnpm prepack && cd ../../',
      (err, stdout, stderr) => {
        if (err) {
          reject(stderr)
        } else {
          resolve()
        }
      }
    )
  })
}

let timeout
function startTimer() {
  timeout = setTimeout(() => {
    progress.timeElapsed = ((performance.now() - startTime) / 1000).toFixed(2)
    if (usingProgressBar) {
      progressBar.update({
        value: Math.min(progress.logs.length, progress.expectedLogs),
        total: progress.expectedLogs,
        suffix: `${progress.step} | ${progress.timeElapsed}s`,
      })
      startTimer()
    }
  }, 10)
}

function buildComplete() {
  if (usingProgressBar) {
    progressBar.stop()
  }
  clearTimeout(timeout)
  if (Object.keys(progress.warnings).length) {
    msg.warn('Build completed with warnings:\n')
    for (const pkg in progress.warnings) {
      msg.warn(`----------\n@formkit/${pkg}`)
      progress.warnings[pkg].forEach((warning) => msg.warn(`\n${warning}\n`))
    }
  }
  msg.success(
    'build complete (' +
    ((performance.now() - startTime) / 1000).toFixed(2) +
    's)'
  )
}

function estimatedLogs(p) {
  switch (p) {
    case 'vue': {
      return 28 // 3 packages to bundle under vue
    }
    case 'themes':
      return 21 * 6 // 6 packages to bundle under themes
    default:
      return 21
  }
}

/**
 * Filly setup the command line tool and options.
 */
export default function () {
  const cli = cac()
  cli
    .command('[package]', 'Builds a specific package', {
      allowUnknownOptions: true,
    })
    .action(buildPackage)
  cli.help()
  cli.parse()
}
