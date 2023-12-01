import prompts from 'prompts'
import { downloadTemplate } from 'giget'
import { slugify } from '@formkit/utils'
import { isDirEmpty } from './utils'
import { resolve } from 'pathe'
import ora from 'ora'

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
  spinner.stop()
}

async function customizePackageJson(_options: CreateThemeOptions) {
  return new Promise((resolve) => setTimeout(resolve, 1000))
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
