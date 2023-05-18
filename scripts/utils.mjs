/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import fs from 'fs'
import { execSync } from 'child_process'
import { dirname, resolve, join, basename, extname } from 'path'
import { fileURLToPath } from 'url'
import ora from 'ora'
import chalk from 'chalk'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
export const packagesDir = resolve(__dirname, '../packages')

export const msg = {
  error: (m) => console.log(chalk.bold.red(m)),
  info: (m) => console.log(chalk.cyan(m)),
  success: (m) => console.log(chalk.green(m)),
  label: (m) => console.log(chalk.bold.magenta(m)),
  headline: (m) =>
    console.log(
      chalk.bold.magenta(
        `\n\n${'='.repeat(Math.min(80, m.length))}\n${m}\n${'='.repeat(
          Math.min(80, m.length)
        )}\n`
      )
    ),
  loader: ora(),
}

/** Given a version string, is it alphanumeric? */
export function isAlphaNumericVersion(string) {
  return /[a-z].(\d+)$/.test(string)
}

/** Given a string, convert it to camelCase */
export function toCamelCase(str) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
      return index === 0 ? word.toLowerCase() : word.toUpperCase()
    })
    .replace(/\s+/g, '')
}

/**
 * Given a directory return all files recursively from subdirectories
 */
export function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath)
  arrayOfFiles = arrayOfFiles || []
  files.forEach(function (file) {
    if (fs.statSync(dirPath + '/' + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles)
    } else {
      arrayOfFiles.push(join(dirPath, '/', file))
    }
  })
  return arrayOfFiles
}

/**
 * Get the available packages from the packages directory.
 */
export function getPackages() {
  const availablePackages = fs.readdirSync(packagesDir)
  return availablePackages
}

/**
 * Get the available locales from the packages directory.
 */
export function getLocales() {
  const availableLocales = fs.readdirSync(`${packagesDir}/i18n/src/locales`)
  return availableLocales.map((file) => file.substring(0, file.length - 3))
}

/**
 * Get the available themes from the themes directory.
 */
export function getThemes() {
  const availablePackages = fs.readdirSync(packagesDir + '/themes/src/css')
  return availablePackages
}

/**
 * Get the available icons from the icons directory.
 */
export function getIcons() {
  const iconFiles = getAllFiles(resolve(packagesDir, 'icons/src/icons'))
  const icons = {}
  iconFiles.forEach((filePath) => {
    const extension = extname(filePath)
    if (extension !== '.ts') return
    const file = basename(filePath, extension)
    const name = toCamelCase(file)
    let data = fs.readFileSync(filePath, 'utf8')
    data = data.replace('export default `', '').replace('</svg>`', '</svg>')
    icons[name] = data
  })
  return icons
}

/**
 * Get all the plugin directories in the themes package at provided path
 */
export function getPlugins(path = '/themes/src') {
  const possiblePlugins = fs.readdirSync(packagesDir + path, {
    withFileTypes: true,
  })
  return possiblePlugins
    .filter((file) => file.isDirectory() && file.name !== 'css')
    .map((file) => file.name)
}

/**
 * Determine the correct build order of a provided array of packages
 */
export function getBuildOrder(packages = [], orderedPackages = []) {
  const packagesSet = new Set(packages)
  let orderedPackagesSet = new Set(orderedPackages)
  for (const pkg of packages) {
    packagesSet.delete(pkg)
    const dependencies = getPackageDependencies(pkg)
    for (const dep of dependencies) {
      if (!orderedPackagesSet.has(dep)) {
        const nestedDeps = getBuildOrder([dep], [...orderedPackagesSet])
        orderedPackagesSet = new Set([...nestedDeps, dep])
      }
    }
    if (packagesSet && packages.size) {
      return getBuildOrder(packages, orderedPackages)
    }
    orderedPackagesSet.add(pkg)
  }
  return [...orderedPackagesSet]
}

/**
 * build a dependency tree of packages. If the inverse argument is supplied
 * the result will be the depenDENT tree instead.
 */
export async function getDependencyTree(packages, inverse = false) {
  const tree = []
  const allPackages = await getPackages()
  for (const pkg of packages) {
    const dependencies = []
    for (const ap of allPackages) {
      if (inverse ? checkDependsOn(ap, pkg) : checkDependsOn(pkg, ap)) {
        const subDependencies = await getDependencyTree([ap], tree, inverse)
        dependencies.push(...subDependencies)
      }
    }
    tree.push([pkg, dependencies.length ? dependencies : false])
  }
  return tree
}

/**
 * Given a dependency tree, produce a flat array of package names in order
 * of dependency
 */
export async function flattenDependencyTree(
  tree = [],
  orderedList = new Set()
) {
  const buildOrder = getBuildOrder(await getPackages())
  if (!Array.isArray(tree)) return []
  for (const branch of tree) {
    const pkg = branch[0]
    const subtree = branch[1]

    if (!orderedList.has(pkg)) {
      orderedList = new Set([
        ...orderedList,
        pkg,
        ...(await flattenDependencyTree(subtree)),
      ])
    }
  }
  orderedList = [...orderedList]
  orderedList.sort(function (a, b) {
    return buildOrder.indexOf(a) - buildOrder.indexOf(b)
  })
  return orderedList
}

/**
 * Given a package and a dependency, see if the given package includes
 * the given dependency
 */
export function checkDependsOn(pkg, dependency) {
  const allDeps = getPackageDependencies(pkg)
  return allDeps.includes(dependency)
}

/**
 * Given a dependency tree, do a pretty console log of the graph
 */
export function drawDependencyTree(
  tree = [],
  depth = 0,
  directoryPrefix = '∟ ',
  parent
) {
  for (const [i, branch] of tree.entries()) {
    const title = branch[0]
    const deps = branch[1]
    const directoryIndent = `${'  '.repeat(depth)}${depth > 0 ? directoryPrefix : ''}${'— '.repeat(Math.min(1, depth))}`
    if (depth === 0) {
      console.log(
        `${i + 1}) ${directoryIndent}${title} ` +
        chalk.dim(`(${getPackageVersion(title)})`)
      )
    } else {
      msg.info(
        `  ${directoryIndent}${title} ` +
        chalk.dim(`(${getDependencyVersion(parent, title)})`)
      )
    }

    if (deps) {
      for (const dep of deps) {
        drawDependencyTree([dep], depth + 1, directoryPrefix, title)
      }
    }
  }
}

/**
 * Given a package name, return relevant build files from the file system
 */
export function getPackageFromFS(pkg) {
  const packageJSON = getPackageJSON(pkg)
  const packageESM = getRawBuildFile(pkg, packageJSON.module)
  const packageTS = getRawBuildFile(pkg, packageJSON.types)

  return {
    packageJSON,
    packageESM,
    packageTS,
  }
}

/**
 * Given a package name, return relevant build files from the file system
 */
export function getRawBuildFile(pkg, path) {
  return fs.readFileSync(`${packagesDir}/${pkg}/${path}`, 'utf-8')
}

/**
 * Given a package name, retrieve the package.json data
 */
export function getPackageJSON(pkg) {
  const packageJSONRaw = fs.readFileSync(`${packagesDir}/${pkg}/package.json`)
  return JSON.parse(packageJSONRaw)
}

/**
 * write package.json file to file system for a given package
 */
export function writePackageJSON(pkg, json) {
  fs.writeFileSync(
    `${packagesDir}/${pkg}/package.json`,
    JSON.stringify(json, null, 2)
  )
}

/**
 * Provide array of dependency packages for a provided package
 */
export function getPackageDependencies(pkg) {
  const packageJSON = getPackageJSON(pkg)
  const dependencies = packageJSON.dependencies ? packageJSON.dependencies : []
  // lets not include dev deps for now:
  // const devDependencies = packageJSON.devDependencies
  //   ? packageJSON.devDependencies
  //   : []
  return [
    ...getFKDependenciesFromObj(dependencies),
    // ...getFKDependenciesFromObj(devDependencies),
  ]
}

/**
 * Given a package name get the current version frem the package.json
 */
export function getPackageVersion(pkg) {
  const packageJSON = getPackageJSON(pkg)
  return packageJSON.version
}

/**
 * Given a dependency and parent package get the current version of the dependency
 * from the parent the package.json
 */
export function getDependencyVersion(pkg, parent) {
  const packageJSON = getPackageJSON(parent)
  const dependencies = packageJSON.dependencies ? packageJSON.dependencies : []
  delete dependencies['@formkit/auto-animate']
  const devDependencies = packageJSON.devDependencies
    ? packageJSON.devDependencies
    : []
  if (Object.keys(dependencies).includes(`@formkit/${pkg}`)) {
    return dependencies[`@formkit/${pkg}`]
  }
  if (Object.keys(devDependencies).includes(`@formkit/${pkg}`)) {
    return devDependencies[`@formkit/${pkg}`]
  }
  return 'null'
}

/**
 * extract matching FK dependency package names from keys in a given object
 */
export function getFKDependenciesFromObj(dependencies) {
  let matches = Object.keys(dependencies).filter(
    (key) => key.startsWith('@formkit/') && key !== '@formkit/auto-animate'
  )
  matches = matches.map((dependency) => dependency.replace('@formkit/', ''))
  return matches
}

/**
 * Given a package name, this will get the latest N commits in the associated directory
 */
export function getLatestPackageCommits(pkg, n = 15) {
  const commitLog = execSync(
    `git rev-list HEAD --all --reverse --max-count=${n} --pretty=oneline -- "${packagesDir}/${pkg}"`,
    {
      encoding: 'utf-8',
    }
  )
  return commitLog
}

/**
 * Returns true if the current git working directory is clean
 */
export function checkGitCleanWorkingDirectory() {
  return !execSync(`git status --untracked-files=no --porcelain`, {
    encoding: 'utf-8',
  })
}

/**
 * Returns true if the current git branch is master
 */
export function checkGitIsMasterBranch() {
  const branch = execSync(`git rev-parse --abbrev-ref HEAD`, {
    encoding: 'utf-8',
  }).toString()
  return branch.trim() === 'master'
}

/**
 * Returns the current git commit hash, with n suffix characters.
 */
export function getCurrentHash(suffix = 7) {
  const hash = execSync(`git rev-parse HEAD`, {
    encoding: 'utf-8',
  })
    .toString()
    .trim()
  return hash.substr(hash.length - suffix)
}

/**
 * Updates the version number export in the @formkit/core package to reflect the
 * version that is about to be published
 */
export function updateFKCoreVersionExport(newVersion) {
  const fileNames = ['index.cjs', 'index.d.ts', 'index.mjs']
  const coreBuiltFiles = {}
  fileNames.forEach((fileName) => {
    coreBuiltFiles[fileName] = fs.readFileSync(
      `${packagesDir}/core/dist/${fileName}`,
      'utf8'
    )
  })
  Object.keys(coreBuiltFiles).forEach((fileName) => {
    coreBuiltFiles[fileName] = coreBuiltFiles[fileName].replace(
      '__FKV__',
      newVersion
    )
    fs.writeFileSync(
      `${packagesDir}/core/dist/${fileName}`,
      coreBuiltFiles[fileName],
      { encoding: 'utf8' }
    )
  })
}

/**
 * Get all the inputs declared in the inputs/index.ts file.
 */
export function getInputs() {
  const inputsDir = resolve(packagesDir, 'inputs/src/inputs')
  const exportFile = resolve(inputsDir, 'index.ts')
  const file = fs.readFileSync(exportFile, { encoding: 'utf-8' })
  return file
    .split(/\r?\n/)
    .filter((line) => !!line.trim())
    .map((line) => {
      const matches = line.match(
        /^export { ([a-zA-Z ]+) } from '\.\/([a-zA-Z]+)'$/
      )
      if (matches) {
        const [, rawName, fileName] = matches
        const names = rawName.split(' ')
        const name = names[names.length - 1]
        const filePath = resolve(inputsDir, `${fileName}.ts`)
        return {
          name,
          filePath,
          fileName,
        }
      } else {
        msg.error(`Failed to parse export from inputs/index.ts: ${line}`)
        process.exit(1)
      }
      return matches
    })
}
