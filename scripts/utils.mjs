/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import fs from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const packagesDir = resolve(__dirname, '../packages')

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
  for (const p of packages) {
    packages.shift()
    const dependencies = getPackageDependencies(p)
    for (const d of dependencies) {
      if (!orderedPackages.includes(d)) {
        const nestedDeps = getBuildOrder([d], orderedPackages)
        orderedPackages = [...nestedDeps, d]
      }
      orderedPackages = [...orderedPackages, p]
    }
    if (packages && packages.length) {
      return getBuildOrder(packages, orderedPackages)
    }
  }
  return orderedPackages
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
