
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
import chalk from 'chalk'
import execa from 'execa'
import ora from 'ora'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import {
  Extractor,
  ExtractorConfig
} from '@microsoft/api-extractor';

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, '../')
const packagesDir = resolve(__dirname, '../packages')
const rollup = `${rootDir}/node_modules/.bin/rollup`

const error = m => console.log(chalk.bold.red(m))
const info = m => console.log(chalk.cyan(m))
const success = m => console.log(chalk.green(m))
const loader = ora()

/**
 * Get the available packages from the packages directory.
 */
let availablePackages = null
async function getPackages() {
  if (!availablePackages) {
    availablePackages = await fs.readdir(packagesDir);
  }
  return availablePackages
}

/**
 * Prompt a user to select a package.
 */
async function selectPackage () {
  const packages = await getPackages()
  const { selection } = await prompts({
    type: 'select',
    name: 'selection',
    message: 'Which FormKit package do you want to build?',
    choices: packages.map(name => ({
      title: name,
      value: name
    }))
  })
  buildPackage(selection)
}

/**
 * Build the selected package.
 * @param p package name
 * @returns
 */
async function buildPackage (p) {
  const packages = await getPackages()
  if (!p) {
    return selectPackage()
  }
  if (!packages.includes(p)) {
    error(`${p} is not an valid package name.`)
  }
  await cleanDist(p)
  info('» bundling distributions')
  loader.start()
  await bundle(p, 'esm')
  await bundle(p, 'cjs')
  loader.stop()
  info('» extracting type definitions')
  loader.start()
  await declarations(p)
  loader.stop()
  success(`✔️ build complete`)
}

/**
 * Remove the dist directory before building anything.
 */
async function cleanDist(p) {
  loader.text = `Removing: ${p}/dist`
  const distDir = `${packagesDir}/${p}/dist`
  try {
    await fs.access(distDir)
    await fs.rm(distDir, { recursive: true });
  } catch {
    // directory is already missing, no need to clean it
  }
  info(`» cleaned dist artifacts`)
}

/**
 * Create a new bundle of a certain format for a certain package.
 * @param p package name
 * @param format the format to create (cjs, esm, umd, etc...)
 */
async function bundle(p, format) {
  loader.text = `Bundling ${p} as ${format}`
  await execa(rollup, [
    '-c',
    '--environment',
    [
      { name: 'PKG', value: p },
      { name: 'FORMAT', value: format }
    ]
      .map(({ name, value }) => `${name}:${value}`)
      .join(',')
  ])
}

/**
 * Emit type declarations for the package to the dist directory.
 * @param p - package name
 */
async function declarations(p) {
  loader.text = `Emitting type declarations`
  await execa(rollup, [
    '-c',
    '--environment',
    [
      { name: 'PKG', value: p },
      { name: 'FORMAT', value: 'esm' },
      { name: 'DECLARATIONS', value: 1 }
    ]
      .map(({ name, value }) => `${name}:${value}`)
      .join(',')
  ])
  // Annoyingly even though we tell @rollup/plugin-typescript
  // emitDeclarationOnly it still outputs an index.js — is this a bug?
  await fs.rm(`${packagesDir}/${p}/dist/index.js`)
  loader.text = `Rolling up type declarations`
  apiExtractor(p)
}

/**
 * Use API Extractor to rollup the type declarations.
 */
async function apiExtractor(p)
{
  const configPath = `${packagesDir}/${p}/api-extractor.json`
  const config = ExtractorConfig.loadFileAndPrepare(configPath);
  const result = Extractor.invoke(config, {
    localBuild: true,
    showVerboseMessages: false
  })
  if (result.succeeded) {
    const distRoot = `${packagesDir}/${p}/dist`
    const distFiles = await fs.readdir(distRoot)
    await Promise.all(distFiles.map(file => {
      return (file !== 'index.all.d.ts' && file.endsWith('d.ts')) ? fs.rm(resolve(distRoot, file)) : Promise.resolve()
    }))
    await fs.rm(resolve(distRoot, 'tsdoc-metadata.json'))
    fs.rename(resolve(distRoot, 'index.all.d.ts'), resolve(distRoot, 'index.d.ts'))
  } else {
    error('Api extractor failed.')
    process.exitCode = 1
  }
}

/**
 * Filly setup the command line tool and options.
 */
 const cli = cac();
 cli.command('[package]', 'Builds a specific package')
   .action(buildPackage);

 cli.help();
 cli.parse();


