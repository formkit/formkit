/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import fs from 'fs'
import { execSync } from "child_process"
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import ora from 'ora'
import chalk from 'chalk'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const packagesDir = resolve(__dirname, '../packages')

export const msg = {
  error: m => console.log(chalk.bold.red(m)),
  info: m => console.log(chalk.cyan(m)),
  success: m => console.log(chalk.green(m)),
  label: m => console.log(chalk.bold.magenta(m)),
  headline: m => console.log(chalk.bold.magenta(`\n\n${'='.repeat(Math.min(80, m.length))}\n${m}\n${'='.repeat(Math.min(80, m.length))}\n`)),
  loader: ora()
}

/** Given a version string, is it alphanumeric? */
export function isAlphaNumericVersion (string) {
  return /[a-z].(\d+)$/.test(string)
}

/**
 * Get the available packages from the packages directory.
 */
export function getPackages() {
  const availablePackages = fs.readdirSync(packagesDir);
  return availablePackages
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
      if (!orderedPackagesSet.has(pkg)) {
        orderedPackagesSet = new Set([...orderedPackagesSet, pkg])
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
export async function getDependencyTree (packages, inverse = false) {
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
export async function flattenDependencyTree (tree = [], orderedList = new Set()) {
  const buildOrder = getBuildOrder(await getPackages())
  if (!Array.isArray(tree)) return []
  for (const branch of tree) {
    const pkg = branch[0]
    const subtree = branch[1]

    if (!orderedList.has(pkg)) {
      orderedList = new Set([...orderedList, pkg, ...await flattenDependencyTree(subtree)])
    }
  }
  orderedList = [...orderedList]
  orderedList.sort(function(a, b){
    return buildOrder.indexOf(a) - buildOrder.indexOf(b);
  })
  return orderedList
}

/**
 * Given a package and a dependency, see if the given package includes
 * the given dependency
 */
export function checkDependsOn (pkg, dependency) {
  const allDeps = getPackageDependencies(pkg)
  return allDeps.includes(dependency)
}


/**
 * Given a dependency tree, do a pretty console log of the graph
 */
export function drawDependencyTree (tree = [], depth = 0, directoryPrefix = '∟ ', parent) {
  for (const [i, branch] of tree.entries()) {
    const title = branch[0]
    const deps = branch[1]
    const directoryIndent = `${'  '.repeat(depth)}${depth > 0 ? directoryPrefix : ''}${'— '.repeat(Math.min(1, depth))}`
    if (depth === 0) {
      console.log(`${i + 1}) ${directoryIndent}${title} ` + chalk.dim(`(${getPackageVersion(title)})`))
    } else {
      msg.info(`  ${directoryIndent}${title} ` + chalk.dim(`(${getDependencyVersion(parent, title)})`))
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
export function getPackageFromFS (pkg) {
  const packageJSON = getPackageJSON(pkg)
  const packageESM = getRawBuildFile(pkg, packageJSON.module)
  const packageTS = getRawBuildFile(pkg, packageJSON.types)

  return {
    packageJSON,
    packageESM,
    packageTS
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
export function getPackageJSON (pkg) {
  const packageJSONRaw = fs.readFileSync(`${packagesDir}/${pkg}/package.json`);
  return JSON.parse(packageJSONRaw)
}

/**
 * write package.json file to file system for a given package
 */
 export function writePackageJSON (pkg, json) {
  fs.writeFileSync(
    `${packagesDir}/${pkg}/package.json`,
    JSON.stringify(json, null, 2)
  )
}

/**
 * Provide array of dependency packages for a provided package
 */
export function getPackageDependencies (pkg) {
  const packageJSON = getPackageJSON(pkg)
  const dependencies = packageJSON.dependencies ? packageJSON.dependencies : []
  const devDependencies = packageJSON.devDependencies ? packageJSON.devDependencies : []
  return [...getFKDependenciesFromObj(dependencies), ...getFKDependenciesFromObj(devDependencies)]
}

/**
 * Given a package name get the current version frem the package.json
 */
export function getPackageVersion (pkg) {
  const packageJSON = getPackageJSON(pkg)
  return packageJSON.version
}

/**
 * Given a dependency and parent package get the current version of the dependency
 * from the parent the package.json
 */
export function getDependencyVersion (pkg, parent) {
  const packageJSON = getPackageJSON(parent)
  const dependencies = packageJSON.dependencies ? packageJSON.dependencies : []
  const devDependencies = packageJSON.devDependencies ? packageJSON.devDependencies : []
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
  let matches = Object.keys(dependencies).filter((key) => key.startsWith('@formkit/'))
  matches = matches.map(dependency => dependency.replace('@formkit/', ''))
  return matches
}

/**
 * Given a package name, this will get the latest N commits in the associated directory
 */
export function getLatestPackageCommits (pkg, n = 15) {
  const commitLog = execSync(
    `git rev-list HEAD --all --reverse --max-count=${n} --pretty=oneline -- "${packagesDir}/${pkg}"`,
    {
      encoding: 'utf-8'
    }
  )
  return commitLog
}

/**
 * Returns true if the current git working directory is clean
 */
export function checkGitCleanWorkingDirectory () {
  return !execSync(
    `git status --untracked-files=no --porcelain`,
    {
      encoding: 'utf-8'
    }
  )
}

/**
 * Returns true if the current git branch is master
 */
 export function checkGitIsMasterBranch () {
  const branch = execSync(
    `git rev-parse --abbrev-ref HEAD`,
    {
      encoding: 'utf-8'
    }
  )
  return branch === 'master'
}
