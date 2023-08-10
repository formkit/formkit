import axios from 'axios'
import { FORMKIT_VERSION } from '@formkit/core'
import { inputs } from '@formkit/inputs'
import { token } from '@formkit/utils'
import { resolve, relative, isAbsolute } from 'path'
import { access, mkdir, writeFile, readFile } from 'fs/promises'
import { error, info, warning, green, __dirname } from './index'
import { constants, existsSync } from 'fs'
import prompts from 'prompts'

/**
 * @internal
 */
export async function exportInput(
  inputOption?: string,
  options: Record<string, string | undefined> = {}
): Promise<void> {
  const input = await requireInput(inputOption)
  const lang = await requireLang(options.lang)
  const exportData = await requireInputCode(input, lang)
  const sourceCode = transformSource(exportData, input)
  const [absoluteDir, relativeDir] = await requireOutputDir(options.dir)
  const validDir = await upsertDir(absoluteDir)

  if (validDir === false)
    return error(`${relativeDir} is not a writable directory.`)
  if (!validDir) return
  const outFile = resolve(absoluteDir, `${input}.${lang}`)
  if (!existsSync(outFile)) {
    await writeFile(outFile, sourceCode)
  } else {
    return error('Did not export input because that file already exists.')
  }
  green(`Success! Exported ${relativeDir}/${input}.${lang}`)
  console.log(`To use it pass it to your FormKit configuration:
  // ...
  import { ${input} } from '${relativeDir}/${input}'
  // ...
  const config = defaultConfig({
    inputs: {
      ${input}
    }
  })
  `)
}

/**
 * Checks if a given directory is writable, if it doesn't exist, create it.
 * @param dir - A directory to create if it doesn't exist.
 * @returns
 */
async function upsertDir(dir: string): Promise<boolean | void> {
  if (!existsSync(dir)) {
    const local = '.' + dir.replace(process.cwd(), '')
    const { confirm } = await prompts({
      type: 'confirm',
      name: 'confirm',
      initial: true,
      message: `Export directory does not exist (${local}) does not exist. Create it?`,
    })
    if (!confirm) return info('Directory not created — no input was exported.')
    try {
      await mkdir(dir, { recursive: true })
    } catch {
      return error(`Unable to create directory ${dir}.`)
    }
  }
  try {
    await access(dir, constants.W_OK)
    return true
  } catch (err) {
    return false
  }
}

/**
 * Attempts to intelligently determine the directory to export to.
 * @param dir - The directory to export the input to.
 * @returns
 */
async function requireOutputDir(
  dir?: string
): Promise<[string, string]> | never {
  if (dir && isAbsolute(dir)) {
    return [dir, relative(process.cwd(), dir)]
  } else if (dir) {
    const abs = resolve(process.cwd(), dir)
    return [abs, relative(process.cwd(), abs)]
  }
  const rel = await prompts({
    type: 'text',
    name: 'dir',
    message:
      'Where should the input be exported to (relative to the current directory)?',
    initial: guessDir(),
  }).then((res) => res.dir)
  const abs = resolve(process.cwd(), rel)
  return [abs, rel]
}

function guessDir() {
  const srcDir = resolve(process.cwd(), 'src')
  if (existsSync(srcDir)) {
    return './src/inputs'
  }
  return './inputs'
}

/**
 * Transforms the source code of the inputs to be used locally.
 * @param exportData - The code to export.
 * @returns
 */
function transformSource(exportData: string, type: string): string | never {
  if (exportData) {
    // Change the exports from relative to npm package based.
    exportData = exportData.replace(
      /(}\sfrom\s['"])\.\.\/(?:index)?(['"])?/g,
      '$1@formkit/inputs$2'
    )
    const memoKey = token()
    exportData = exportData.replace(
      /(schemaMemoKey:\s?['"])[a-zA-Z0-9]+(['"])/g,
      `$1${memoKey}$2`
    )
    // Inject the forceTypeProp in the definition.
    exportData = exportData.replace(
      /^  props: \[(.*)\],/gm,
      `  props: [$1],
  /**
   * Forces node.props.type to be this explicit value.
   */
  forceTypeProp: '${type}',`
    )
  } else {
    error('Unable to export the input file because it cannot be located.')
  }
  return exportData
}

/**
 * Determine the language the user wants to export.
 * @param lang - The language to export the input to.
 * @returns
 */
async function requireLang(lang?: string): Promise<string> {
  if (!lang) {
    const guessedLang = guessLang()
    lang = await prompts({
      type: 'select',
      name: 'lang',
      message: 'What language should be used?',
      choices: [
        guessedLang === 'ts'
          ? { title: 'TypeScript', value: 'ts' }
          : { title: 'JavaScript', value: 'js' },
        guessedLang === 'ts'
          ? { title: 'JavaScript', value: 'js' }
          : { title: 'TypeScript', value: 'ts' },
      ],
    }).then((val) => val.lang)
    if (!lang) {
      error('No language selected, exiting.')
    }
  }
  return lang
}

/**
 * Fetch the input name that the user wants to export.
 * @param inputName - The name of the input to load.
 * @returns
 */
async function requireInput(inputName?: string): Promise<string> | never {
  if (!inputName) {
    const res = await prompts({
      type: 'autocomplete',
      name: 'inputName',
      message: 'What input do you want to export?',
      choices: Object.keys(inputs).map((i) => ({
        title: i,
        value: i,
      })),
    })
    inputName = res.inputName
  }
  if (!inputName || !(inputName in inputs)) {
    error(
      `Cannot export “${inputName}” because it is not part of the @formkit/inputs package.`
    )
  }
  return inputName
}

/**
 * Loads the string data of an input that should be exported.
 * @param name - The name of the input to load.
 * @param lang - The language to load the input in.
 * @returns
 */
async function requireInputCode(
  name: string,
  lang?: string
): Promise<string> | never {
  lang = !lang ? guessLang() : lang
  const localFile = resolve(
    __dirname,
    `../../inputs/dist/exports/${name}.${lang}`
  )
  let fileData = null
  if (existsSync(localFile)) {
    fileData = await readFile(localFile, { encoding: 'utf8' })
  } else {
    warning(`Unable to locate ${localFile}`)
    const cdnUrl = `https://cdn.jsdelivr.net/npm/@formkit/inputs@${FORMKIT_VERSION}/dist/exports/${name}.${lang}`
    try {
      const res = await axios.get(cdnUrl)
      fileData = res.data
    } catch (e: any) {
      if (e && e?.response?.status) {
        error(`${e.response.status} — unable to load ${localFile}`)
      } else {
        error(
          'Unable to load input file — probably a network error. Are you online?'
        )
      }
    }
  }

  if (!fileData) {
    info('Checking CDN for an exportable input.')
  }

  if (!fileData) {
    error(`Unable to load export ${name}.${lang}`)
  } else {
    return fileData
  }
}

/**
 * Guess the language the user is leveraging on their project.
 */
function guessLang() {
  const tsconfig = resolve(process.cwd(), 'tsconfig.json')
  return existsSync(tsconfig) ? 'ts' : 'js'
}
