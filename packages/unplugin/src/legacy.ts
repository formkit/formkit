import type { UnpluginFactory } from 'unplugin'
import { createUnplugin } from 'unplugin'
import type { Options } from './types'
import { resolve } from 'pathe'
import { existsSync } from 'fs'
import { parse } from '@vue/compiler-dom'
import type { RootNode, ElementNode, AttributeNode } from '@vue/compiler-dom'

const FORMKIT_CONFIG_ID = 'virtual:formkit-config'
const FORMKIT_PROVIDER_IMPORT_STATEMENT = [
  `import { FormKitProvider } from "@formkit/vue";`,
  `import __formkitConfig from "${FORMKIT_CONFIG_ID}";`,
].join('\n')
/**
 * A relatively cheap, albeit not foolproof, regex to determine if the code
 * being processed contains FormKit usage.
 */
const CONTAINS_FORMKIT_RE = /<FormKit|<form-kit/

function getRootBlock(
  root: RootNode,
  block: 'template' | 'script' | 'style'
): ElementNode | undefined {
  const node = root.children.find(
    (node) => node.type === 1 && node.tag === block
  ) as ElementNode | undefined
  if (node && block === 'template' && node.children.length === 1) {
    const rootChild = node.children[0].type === 1 ? node.children[0] : undefined
    const tag = (rootChild?.tag ?? '').toLocaleLowerCase()
    if (
      rootChild &&
      tag !== 'formkit' &&
      tag !== 'form-kit' &&
      tag !== 'formkitschema' &&
      tag !== 'form-kit-schema' &&
      !rootChild.isSelfClosing
    ) {
      // In this case the component has a root node that is not formkit and is
      // not self-closing, like, perhaps, a div. We need to move the provider
      // inside this div instead of outside it.
      return rootChild
    }
  }
  return node
}

/**
 * Checks if a given script node is a setup script.
 * @param node - a script node
 */
function isSetupScript(node: ElementNode) {
  return node.props.some((prop) => prop.type === 6 && prop.name === 'setup')
}

function langAttr(node?: ElementNode): string {
  if (!node) return ''
  const langProp = node.props.find(
    (prop) => prop.type === 6 && prop.name === 'lang'
  ) as AttributeNode | undefined
  if (langProp && langProp.value?.content) {
    return ` lang="${langProp.value.content}"`
  }
  return ''
}

/**
 * Imports `FormKitProvider` component into the script block of the SFC.
 * @param code - The SFC source code.
 * @param id - The ID of the SFC file.
 */
function injectProviderImport(code: string): string {
  let root: RootNode
  try {
    root = parse(code)
  } catch (err) {
    console.warn('Failed to parse SFC:', code)
    console.error(err)
    return code
  }
  const script = getRootBlock(root, 'script')
  const setupScript = root.children.find(
    (node): node is ElementNode =>
      node.type === 1 && node.tag === 'script' && isSetupScript(node)
  )
  if (!setupScript) {
    return [
      `<script setup${langAttr(script)}>`,
      FORMKIT_PROVIDER_IMPORT_STATEMENT,
      `</script>`,
      code,
    ].join('\n')
  }
  const startAt = setupScript.children[0].loc.start.offset
  const before = code.substring(0, startAt)
  const after = code.substring(startAt)
  return `${before}\n${FORMKIT_PROVIDER_IMPORT_STATEMENT}${after}`
}

/**
 * Injects the `<FormKitProvider>` component import into the SFC.
 * @param code - The SFC source code.
 * @param id - The ID of the SFC file.
 */
function injectProviderComponent(
  code: string,
  id: string
): { code: string; map?: null } {
  let root: RootNode
  try {
    root = parse(code)
  } catch (err) {
    console.warn('Failed to parse SFC:', code)
    console.error(err)
    return { code }
  }
  const template = getRootBlock(root, 'template')
  if (!template) {
    console.warn(
      `No <template> block found in ${id}. Skipping FormKitProvider injection.`
    )
    return { code, map: null }
  }
  const startInsertAt = template.children[0].loc.start.offset
  const endInsertAt =
    template.children[template.children.length - 1].loc.end.offset

  code = [
    code.substring(0, startInsertAt),
    `<FormKitProvider :config="__formkitConfig">`,
    code.substring(startInsertAt, endInsertAt),
    '</FormKitProvider>',
    code.substring(endInsertAt),
  ].join('\n')

  return { code, map: null }
}

/**
 * Resolve the absolute path to the configuration file.
 * @param configFile - The configuration file to attempt to resolve.
 */
function resolveConfig(configFile: string): string | undefined {
  const exts = ['ts', 'mjs', 'js']
  const dir = configFile.startsWith('.') ? process.cwd() : ''
  let paths: string[] = []

  if (exts.some((ext) => configFile.endsWith(ext))) {
    // If the config file has an extension, we don't need to try them all.
    paths = [resolve(dir, configFile)]
  } else {
    // If the config file doesn’t have an extension, try them all.
    paths = exts.map((ext) => resolve(dir, `${configFile}.${ext}`))
  }
  return paths.find((path) => existsSync(path))
}

export const unpluginFactory: UnpluginFactory<Options | undefined> = (
  options = {
    configFile: './formkit.config',
    defaultConfig: true,
  }
) => {
  return {
    name: 'unplugin-formkit',
    enforce: 'pre',

    resolveId(id) {
      if (id === FORMKIT_CONFIG_ID) {
        return id
      }
      return null
    },

    load(id) {
      if (id === FORMKIT_CONFIG_ID) {
        // Resolve FormKit configuration file path on-demand in case user has created/removed it since plugin was initialized.
        const configPath = resolveConfig(
          options.configFile || './formkit.config'
        )
        const customConfigDefinition = configPath
          ? [
              `import _config from "${configPath}";`,
              `const config = typeof _config === 'function' ? _config() : _config;`,
            ].join('\n')
          : 'const config = {};'

        if (options.defaultConfig !== false) {
          return [
            `import { defaultConfig } from "@formkit/vue";`,
            customConfigDefinition,
            `export default defaultConfig(config);`,
          ].join('\n')
        }

        return [customConfigDefinition, `export default config;`].join('\n')
      }
      return null
    },

    // webpack's id filter is outside of loader logic,
    // an additional hook is needed for better perf on webpack
    transformInclude(id) {
      return id.endsWith('.vue')
    },

    // just like rollup transform
    async transform(code, id) {
      // Test if the given code is a likely candidate for FormKit usage.
      if (id.endsWith('.vue') && CONTAINS_FORMKIT_RE.test(code)) {
        return injectProviderComponent(injectProviderImport(code), id)
      }
      return null
    },
  }
}

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)
