import { readdir } from 'fs/promises'

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
