import prompts from 'prompts'
import { downloadTemplate } from 'giget'
import { slugify } from '@formkit/utils'
import { isDirEmpty } from './utils'
import { resolve } from 'pathe'
import { unlink, writeFile } from 'fs/promises'
import ora from 'ora'
import { green, info } from './index'
import { readPackageJSON, writePackageJSON, getGitUser } from './utils'

interface CreateThemeOptions {
  name: string
  packageName: string
  dir: string
}

export async function createTheme(
  name: string,
  initialOptions: Partial<CreateThemeOptions>
) {
  // Do some stuff here
  const settings = await completeOptions(name, initialOptions)
  const spinner = ora(`Downloading starter theme...`).start()
  await downloadTemplate('github:formkit/theme-starter', {
    dir: settings.dir,
  })
  spinner.text = `Customizing package.json...`
  await customizePackageJson(settings)
  spinner.text = `Writing LICENSE.txt...`
  await writeLicense(settings)
  spinner.stop()
  green('Theme scaffolded successfully!')
  info(
    'Next steps:\n1. cd into your theme directory\n2. Run `pnpm install`\n3. Run `pnpm dev`'
  )
}

async function customizePackageJson(options: CreateThemeOptions) {
  const packageJson = await readPackageJSON(options.dir)
  packageJson.name = options.packageName
  packageJson.description = `A FormKit theme.`
  packageJson.version = `0.0.1`
  packageJson.contributors = [await getGitUser()]
  await writePackageJSON(options.dir, packageJson)
  unlink(resolve(options.dir, './pnpm-lock.yaml'))
}

async function writeLicense(options: CreateThemeOptions) {
  const user = await getGitUser()
  const MIT = `MIT License

  Copyright (c) ${new Date().getFullYear()}-present ${user}.

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.`
  await writeFile(resolve(options.dir, './LICENSE.txt'), MIT)
}

async function completeOptions(
  name: string,
  options: Partial<CreateThemeOptions>
): Promise<CreateThemeOptions> {
  while (!name) {
    const { themeName } = await prompts({
      type: 'text',
      name: 'themeName',
      message: 'The name of your theme, for example "Monokai"',
    })
    name = themeName
  }

  let packageName = options.packageName
  if (!packageName) {
    const { themePackageName } = await prompts({
      type: 'text',
      name: 'themePackageName',
      message:
        'The name of the package on npm, for example formkit-theme-monokai.',
      initial: `formkit-theme-${slugify(name)}`,
    })
    packageName = themePackageName as string
  }

  let dirName = options.dir
  let emptyDir = dirName
    ? await isDirEmpty(resolve(process.cwd(), `./${dirName}`))
    : false

  while (!dirName || !emptyDir) {
    const { directory } = await prompts({
      type: 'text',
      name: 'directory',
      message: `The directory to create the theme in.`,
      initial: options.dir || packageName,
    })
    dirName = directory
    emptyDir = await isDirEmpty(resolve(process.cwd(), `./${dirName}`))
  }
  const dir = resolve(process.cwd(), `./${dirName}`)

  return {
    name,
    packageName,
    dir,
  }
}
