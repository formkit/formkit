import { existsSync } from 'fs'
import { resolve } from 'pathe'

const CONTAINS_FORMKIT_RE = /<FormKit|<form-kit/
const FORMKIT_CONFIG_RE = /(\/\*\s?@__formkit\.config\.ts__\s?\*\/(?:.|\n)+?)\)/g

function scriptLangAttr(code: string): string {
  const scriptOpen = code.match(/<script\b([^>]*)>/)
  if (!scriptOpen) return ''
  const lang = scriptOpen[1].match(/\blang=(["'])(.*?)\1/)
  return lang?.[2] ? ` lang="${lang[2]}"` : ''
}

function injectProviderImport(code: string): string {
  const importStatement = `import { FormKitLazyProvider } from '@formkit/vue'`
  const setupScript = code.match(/<script\b([^>]*)\bsetup\b([^>]*)>/)
  if (!setupScript || setupScript.index === undefined) {
    return `<script setup${scriptLangAttr(code)}>${importStatement}</script>
${code}`
  }
  const startAt = setupScript.index + setupScript[0].length
  return `${code.substring(0, startAt)}
${importStatement}${code.substring(startAt)}`
}

function injectProviderComponent(
  code: string,
  id: string,
  config: boolean,
  defaultConfig?: boolean
) {
  const templateOpen = code.match(/<template\b[^>]*>/)
  const endInsertAt = code.lastIndexOf('</template>')
  if (!templateOpen || templateOpen.index === undefined || endInsertAt === -1) {
    console.warn(
      `No <template> block found in ${id}. Skipping FormKitLazyProvider injection.`
    )
    return { code, map: null }
  }
  const open = `<FormKitLazyProvider${config ? ' config-file="true"' : ''}${
    defaultConfig === false ? ' :default-config="false"' : ''
  }>`
  const close = '</FormKitLazyProvider>'
  const startInsertAt = templateOpen.index + templateOpen[0].length
  code = `${code.substring(0, startInsertAt)}
${open}
${code.substring(startInsertAt, endInsertAt)}
${close}
${code.substring(endInsertAt)}`
  return { code, map: null }
}

function resolveConfig(configFile: string): string | undefined {
  const exts = ['ts', 'mjs', 'js']
  const dir = configFile.startsWith('.') ? process.cwd() : ''
  const paths = exts.some((ext) => configFile.endsWith(ext))
    ? [resolve(dir, configFile)]
    : exts.map((ext) => resolve(dir, `${configFile}.${ext}`))
  return paths.find((path) => existsSync(path))
}

export function formKitAutoImportPlugin(options: {
  configFile?: string
  defaultConfig?: boolean
}) {
  const configPath = resolveConfig(options.configFile || './formkit.config')
  return {
    name: 'unplugin-formkit',
    enforce: 'pre' as const,
    vite: {
      config() {
        return {
          optimizeDeps: {
            exclude: ['@formkit/vue'],
          },
        }
      },
    },
    transformInclude() {
      return true
    },
    async transform(code: string, id: string) {
      if (configPath && FORMKIT_CONFIG_RE.test(code)) {
        code = code.replace(FORMKIT_CONFIG_RE, `"${configPath}")`)
        if (options.defaultConfig === false) {
          code = code.replace(
            /\/\* @__default-config__ \*\/(?:.|\n)+?\/\* @__default-config__ \*\//gi,
            ''
          )
        }
        return { code, map: null }
      }
      if (id.endsWith('.vue') && CONTAINS_FORMKIT_RE.test(code)) {
        return injectProviderComponent(
          injectProviderImport(code),
          id,
          !!configPath,
          options.defaultConfig
        )
      }
      return
    },
  }
}
