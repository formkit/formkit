import { readdir, readFile, writeFile } from 'fs/promises'
import { resolve } from 'pathe'
import { exec } from 'child_process'
import { promisify } from 'util'

/**
 * Checks if a given directory is empty.
 * @param path - The absolute path to check if empty.
 */
export async function isDirEmpty(path: string) {
  try {
    const entries = await readdir(path)
    return entries.length === 0
  } catch (error) {
    return true
  }
}

export async function readPackageJSON(dir: string) {
  const packageJsonPath = resolve(dir, `./package.json`)
  const raw = await readFile(packageJsonPath, 'utf-8')
  return JSON.parse(raw)
}

export async function writePackageJSON(dir: string, data: any) {
  const packageJsonPath = resolve(dir, `./package.json`)
  await writeFile(packageJsonPath, JSON.stringify(data, null, 2))
}

const execAsync = promisify(exec)

// Async function to get the Git user name and email
export const getGitUser = async () => {
  const { stdout: name } = await execAsync('git config --get user.name')
  return name.trim()
}
