/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import fs from 'fs'
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
  loader: ora()
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
  for (const p of packages) {
    packagesSet.delete(p)
    const dependencies = getPackageDependencies(p)
    for (const d of dependencies) {
      if (!orderedPackagesSet.has(d)) {
        const nestedDeps = getBuildOrder([d], [...orderedPackagesSet])
        orderedPackagesSet = new Set([...nestedDeps, d])
      }
      if (!orderedPackagesSet.has(p)) {
        orderedPackagesSet = new Set([...orderedPackagesSet, p])
      }
    }
    if (packagesSet && packages.size) {
      return getBuildOrder(packages, orderedPackages)
    }
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
  for (const p of packages) {
    const dependencies = []
    for (const ap of allPackages) {
      if (inverse ? checkDependsOn(p, ap) : checkDependsOn(ap, p)) {
        const subDependencies = await getDependencyTree([ap], tree, inverse)
        dependencies.push(...subDependencies)
      }
    }
    tree.push([p, dependencies.length ? dependencies : false])
  }
  return tree
}

/**
 * Given a package and a dependency, see if the given dependency is a
 * dependent of the package
 */
export function checkDependsOn (p, dependency) {
  const allDeps = getPackageDependencies(dependency)
  return allDeps.includes(p)
}


/**
 * Given a dependency tree, do a pretty console log of the graph
 */
export function drawDependencyTree (tree = [], depth = 0, directoryPrefix = '∟ ') {
  for (const [i, branch] of tree.entries()) {
    const title = branch[0]
    const deps = branch[1]
    const directoryIndent = `${'  '.repeat(depth)}${depth > 0 ? directoryPrefix : ''}${'— '.repeat(Math.min(1, depth))}`
    if (depth === 0) {
      console.log(`${i + 1}) ${directoryIndent}${title}`)
    } else {
      msg.info(`  ${directoryIndent}${title}`)
    }

    if (deps) {
      for (const dep of deps) {
        drawDependencyTree([dep], depth + 1, '∟ ')
      }
    }
  }
}

/**
 * Provide array of dependency packages for a provided package
 */
export function getPackageDependencies (p) {
  const packageJSONRaw = fs.readFileSync(resolve(__dirname, `../packages/${p}/package.json`));
  const packageJSON = JSON.parse(packageJSONRaw)
  const dependencies = packageJSON.dependencies ? packageJSON.dependencies : []
  const devDependencies = packageJSON.devDependencies ? packageJSON.devDependencies : []
  return [...getFKDependenciesFromObj(dependencies), ...getFKDependenciesFromObj(devDependencies)]
}

/**
 * extract matching FK dependency package names from keys in a given object
 */
export function getFKDependenciesFromObj(dependencies) {
  let matches = Object.keys(dependencies).filter((key) => key.startsWith('@formkit/'))
  matches = matches.map(dependency => dependency.replace('@formkit/', ''))
  return matches
}
