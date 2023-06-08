/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

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
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { Extractor, ExtractorConfig } from '@microsoft/api-extractor'
import { remove, move } from 'fs-extra'
import {
  getPackages,
  getThemes,
  getIcons,
  getBuildOrder,
  getPlugins,
  msg,
  getInputs,
} from './utils.mjs'
import { exec } from 'child_process'

const augmentations = {
  vue: `
/**
 * Augment Vue’s globalProperties.
 * @public
 */
declare module 'vue' {
  interface ComponentCustomProperties {
    $formkit: FormKitVuePlugin
  }
  interface GlobalComponents {
    FormKit: typeof FormKit
    FormKitSchema: typeof FormKitSchema
  }
}
`,
  zod: `
/**
 * Extend FormKitNode with setZodErrors.
 */
declare module '@formkit/core' {
  interface FormKitNodeExtensions {
    setZodErrors(zodError: z.ZodError | undefined): FormKitNode
  }
}
`,
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, '../')
const packagesDir = resolve(__dirname, '../packages')
const rollup = `${rootDir}/node_modules/.bin/rollup`

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
  buildPackage(selection)
}

/**
 * Build the selected package.
 * @param p package name
 * @returns
 */
export async function buildPackage(p) {
  const packages = getPackages()
  if (!p) {
    return selectPackage()
  }
  if (p.includes('cancel')) {
    msg.error(`The build was cancelled. 👋`)
    return
  }
  if (p.includes('build all') || p === 'all') {
    msg.info('» Building all packages...')
    buildAllPackages(packages)
    return
  }
  if (!packages.includes(p)) {
    msg.error(`${p} is not an valid package name.`)
  }
  await cleanDist(p)
  msg.info('» bundling distributions')
  msg.loader.start()
  if (p === 'nuxt') {
    await buildNuxtModule()
  } else {
    await bundle(p, 'esm')
    await bundle(p, 'cjs')
    if (p === 'vue') {
      await bundle(p, 'iife')
    }
  }

  msg.loader.stop()
  msg.info('» extracting type definitions')
  msg.loader.start()
  if (p !== 'nuxt') await declarations(p)

  // special case for CSS themes, processing needs to happen AFTER
  // type declarations are extracted from the non-CSS theme exports
  if (p === 'themes') await themesBuildExtras()

  if (p === 'inputs') await inputsBuildExtras()

  if (p === 'addons') await addonsBuildExtras()

  // special case for Icons package
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

  msg.loader.stop()
  msg.success(`📦 build complete`)
}

/**
 * Loops through all packages and builds them in correct order
 */
export async function buildAllPackages(packages) {
  const orderedPackages = getBuildOrder(packages)
  msg.info('» Building packages in dependency order:')
  console.log(orderedPackages)
  for (const [i, p] of orderedPackages.entries()) {
    msg.label(`» Building ${i + 1}/${orderedPackages.length}: @formkit/${p}`)
    await buildPackage(p)
  }
}

/**
 * Output a typescript input file for each `type` key.
 */
export async function inputsBuildExtras() {
  msg.info('» Exporting inputs by type')
  const inputs = getInputs()
  const distDir = resolve(packagesDir, 'inputs/dist/exports')
  await fs.mkdir(distDir, { recursive: true })
  await Promise.all(
    inputs.map(async (input) => {
      // await execa('cp', [input.filePath, resolve(distDir, `${input.name}.ts`)])
      let fileData = await fs.readFile(input.filePath, { encoding: 'utf8' })
      fileData = fileData.replace("} from '../compose'", "} from '../index'")
      await fs.writeFile(resolve(distDir, `${input.name}.ts`), fileData)
    })
  )
  const tsconfig = resolve(distDir, 'tsconfig.json')
  const tsData = JSON.parse(
    await fs.readFile(resolve(rootDir, 'tsconfig.json'))
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
  const themes = getThemes()
  await Promise.all(
    themes.map((theme) => bundle('themes', 'esm', ['theme', theme]))
  )
  const plugins = getPlugins()
  await Promise.all(
    plugins.map((plugin) =>
      Promise.all([
        bundle('themes', 'esm', ['plugin', plugin]),
        bundle('themes', 'cjs', ['plugin', plugin]),
        declarations('themes', plugin),
      ])
    )
  )
  const nestedTailwindPlugins = getPlugins('/themes/src/tailwindcss')
  await Promise.all(
    nestedTailwindPlugins.map((plugin) =>
      Promise.all([
        bundle('themes', 'esm', ['plugin', `tailwindcss/${plugin}`]),
        bundle('themes', 'cjs', ['plugin', `tailwindcss/${plugin}`]),
        declarations('themes', `tailwindcss/${plugin}`),
      ])
    )
  )
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
 * Remove the dist directory before building anything.
 */
async function cleanDist(p) {
  msg.loader.text = `Removing: ${p}/dist`
  const distDir = `${packagesDir}/${p}/dist`
  try {
    await fs.access(distDir)
    const files = await fs.readdir(distDir)
    await Promise.all(
      files.map((file) => fs.rm(resolve(distDir, file), { recursive: true }))
    )
  } catch {
    // directory is already missing, no need to clean it
  }
  msg.info(`» cleaned dist artifacts`)
}

/**
 * Create a new bundle of a certain format for a certain package.
 * @param p package name
 * @param format the format to create (cjs, esm, umd, etc...)
 */
async function bundle(p, format, subPackage) {
  const args = [
    { name: 'PKG', value: p },
    { name: 'FORMAT', value: format },
  ]
  if (subPackage && subPackage[0] === 'theme') {
    args.push({ name: 'THEME', value: subPackage[1] })
    msg.loader.text = `Bundling theme ${subPackage[1]} (${format})`
  } else if (subPackage && subPackage[0] === 'plugin') {
    args.push({ name: 'PLUGIN', value: subPackage[1] })
    msg.loader.text = `Bundling ${subPackage[1]} plugin (${format})`
  } else {
    msg.loader.text = `Bundling ${p} as ${format}`
  }
  await execa(rollup, [
    '-c',
    '--environment',
    args.map(({ name, value }) => `${name}:${value}`).join(','),
  ])
}

async function buildNuxtModule() {
  msg.loader.text = `Bundling Nuxt module`
  return new Promise((resolve, reject) => {
    exec(
      'cd ./packages/nuxt && pnpm prepack && cd ../../',
      (err, stdout, stderr) => {
        if (err) {
          reject(stderr)
        } else {
          console.log(stdout)
          resolve()
        }
      }
    )
  })
}

/**
 * Emit type declarations for the package to the dist directory.
 * @param p - package name
 */
async function declarations(p, plugin = '') {
  msg.loader.text = `Emitting type declarations`
  const args = [
    { name: 'PKG', value: p },
    { name: 'FORMAT', value: 'esm' },
    { name: 'DECLARATIONS', value: 1 },
  ]
  if (plugin) args.push({ name: 'PLUGIN', value: plugin })
  const output = await execa(rollup, [
    '-c',
    '--environment',
    args.map(({ name, value }) => `${name}:${value}`).join(','),
  ])
  if (output.exitCode) {
    console.log(output)
    process.exit()
  }
  // Annoyingly even though we tell @rollup/plugin-typescript
  // emitDeclarationOnly it still outputs an index.js — is this a bug?
  const artifactToDelete = resolve(
    packagesDir,
    `${p}/dist/${plugin ? plugin + '/' : ''}index.js`
  )
  let shouldDelete
  try {
    shouldDelete = await fs.stat(artifactToDelete)
  } catch {
    shouldDelete = false
  }
  if (shouldDelete) {
    await fs.rm(artifactToDelete)
  }
  if (plugin) {
    msg.loader.text = `Emitting type declarations for ${plugin}`
    await move(
      resolve(
        packagesDir,
        `themes/dist/${plugin}/packages/themes/src/${plugin}/index.d.ts`
      ),
      resolve(packagesDir, `themes/dist/${plugin}/index.d.ts`)
    )
    await remove(resolve(packagesDir, `themes/dist/${plugin}/packages`))
  } else {
    msg.loader.text = `Rolling up type declarations`
    await apiExtractor(p)
    console.log('done rolling up')
  }
}

/**
 * Use API Extractor to rollup the type declarations.
 */
async function apiExtractor(p) {
  const configPath = resolve(packagesDir, `${p}/api-extractor.json`)
  const config = ExtractorConfig.loadFileAndPrepare(configPath)
  const result = Extractor.invoke(config, {
    localBuild: true,
    showVerboseMessages: false,
  })
  if (result.succeeded) {
    const distRoot = resolve(packagesDir, `${p}/dist`)
    const distFiles = await fs.readdir(distRoot, { withFileTypes: true })
    await Promise.all(
      distFiles.map((file) => {
        return file.name !== 'index.all.d.ts' &&
          (file.isDirectory() || file.name.endsWith('d.ts'))
          ? fs.rm(resolve(distRoot, file.name), { recursive: true })
          : Promise.resolve()
      })
    )
    await fs.rm(resolve(distRoot, 'tsdoc-metadata.json'))
    await fs.rename(
      resolve(distRoot, 'index.all.d.ts'),
      resolve(distRoot, 'index.d.ts')
    )
    if (p in augmentations) {
      msg.loader.text = `Augmenting modules in ${p} type declaration.`
      const declarations = await fs.readFile(
        resolve(distRoot, 'index.d.ts'),
        'utf8'
      )
      await fs.writeFile(
        resolve(distRoot, 'index.d.ts'),
        declarations.replace('export { }', augmentations[p])
      )
    }
  } else {
    msg.error('Api extractor failed.')
    process.exitCode = 1
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
