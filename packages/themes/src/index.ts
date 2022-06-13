import { FORMKIT_VERSION, FormKitNode, FormKitClasses } from '@formkit/core'

/**
 * A function that returns a class list string
 * @internal
 */
type ClassFunction = (node: FormKitNode, sectionKey: string) => string

/**
 * A function that returns an icon SVG string
 * @public
 */
export interface FormKitIconLoader {
  (iconName: string):string | undefined | Promise<string | undefined>
}

/**
 * A function to generate FormKit class functions from a javascript object
 * @param classes - An object of input types with nested objects of sectionKeys and class lists
 * @returns FormKitClassFunctions
 * @public
 */
export function generateClasses(
  classes: Record<string, Record<string, string>>
): Record<string, string | FormKitClasses | Record<string, boolean>> {
  const classesBySectionKey: Record<string, Record<string, any>> = {}
  Object.keys(classes).forEach((type) => {
    Object.keys(classes[type]).forEach((sectionKey) => {
      if (!classesBySectionKey[sectionKey]) {
        classesBySectionKey[sectionKey] = {
          [type]: classes[type][sectionKey],
        }
      } else {
        classesBySectionKey[sectionKey][type] = classes[type][sectionKey]
      }
    })
  })

  Object.keys(classesBySectionKey).forEach((sectionKey) => {
    const classesObject = classesBySectionKey[sectionKey]
    classesBySectionKey[sectionKey] = function (node, sectionKey) {
      return addClassesBySection(node, sectionKey, classesObject)
    } as ClassFunction
  })

  return classesBySectionKey
}

/**
 * Updates a class list for a given sectionKey
 * @param node - the FormKit node being operated on
 * @param sectionKey - The section key to which the class list will be applied
 * @param classByType - Object containing mappings of class lists to section keys
 * @returns
 * @public
 */
function addClassesBySection(
  node: FormKitNode,
  _sectionKey: string,
  classesByType: Record<string, () => string>
): string {
  const type = node.props.type
  let classList = ''
  if (classesByType.global) {
    classList += classesByType.global + ' '
  }
  if (classesByType[type]) {
    classList += classesByType[type]
  }
  const listParts = classList.split('$reset')
  if (listParts.length > 1) {
    return `$reset ${listParts[listParts.length - 1].trim()}`
  }
  return listParts[0].trim()
}

/**
 * The document's computed CSS styles
 */
let documentStyles: Record<any, any> = {}

/**
 * iconRegistry proxy setup.
 * When an icon that does not exist is requested it attempts to source it
 * from a local css variable.
 */
const iconRegistryTarget: Record<string, string | undefined> = {}
const iconRegistryHandler: Record<string, any> = {
  get(target: Record<string, string>, prop: string) {
    if (target[prop]) {
      // we have the icon so return it
      return target[prop]
    }
    if (documentStyles.getPropertyValue(`--fk-icon-${prop}`)) {
      // if we have a matching icon in the CSS properties, then decode it
      const icon: string = atob(documentStyles.getPropertyValue(`--fk-icon-${prop}`))
      if (icon.startsWith('<svg')) {
        target[prop] = icon
        return target[prop]
      }
    }
    return undefined
  }
}
/**
 * The FormKit icon Registry - a global record of loaded icons.
 * @public
 */
export const iconRegistry = new Proxy(iconRegistryTarget, iconRegistryHandler)

/**
 * Creates the theme plugin based on a given theme name
 * @param theme - The name or id of the theme to apply
 * @param iconLoader - A function that handles loading an icon
 * @public
 */
export function createThemePlugin(
  theme?: string,
  iconLoader?: FormKitIconLoader,
  icons?: Record<string, string | undefined>
): ((node: FormKitNode) => any) {
  if (icons) {
    // add any user-provided icons to the registry
    Object.assign(iconRegistry, icons)
  }

  let themeDidLoad: (value?: unknown) => void
  const themeLoaded = new Promise((res) => themeDidLoad = res)
  documentStyles = getComputedStyle(document.documentElement)
  const documentThemeLinkTag = document.getElementById('formkit-theme')

  if (
    theme &&
    // if we have a window object
    typeof window !== undefined &&
    // we don't have an existing theme OR the theme being set up is different
    ((
      !documentStyles.getPropertyValue('--formkit-theme') &&
      !documentThemeLinkTag
    ) || (
      documentThemeLinkTag?.getAttribute('data-theme') &&
      documentThemeLinkTag?.getAttribute('data-theme') !== theme
    ))
  ) {
    // if for some reason we didn't overwrite the __FKV__ token during publish
    // then use the `latest` tag for CDN fetching. (this applies to local dev as well)
    const formkitVersion = FORMKIT_VERSION.startsWith('__') ? 'latest' : FORMKIT_VERSION
    const themeUrl = `https://cdn.jsdelivr.net/npm/@formkit/themes@${formkitVersion}/dist/${theme}/theme.css`
    const link = document.createElement('link')
    link.type = 'text/css'
    link.rel = 'stylesheet'
    link.id = 'formkit-theme'
    link.setAttribute('data-theme', theme)
    link.onload = () => {
      documentStyles = getComputedStyle(document.documentElement) // grab new variables from theme
      themeDidLoad()
    }
    document.head.appendChild(link)
    link.href = themeUrl
    // if we had an existing theme being loaded, remove it.
    if (documentThemeLinkTag) {
      documentThemeLinkTag.remove()
    }
  }

  const iconHandler = handleIcons(iconLoader)

  const themePlugin = async function themePlugin(node: FormKitNode) {
    await themeLoaded
    node.addProps(['iconHandler'])
    if (typeof node.props.iconHandler === 'undefined') {
      node.props.iconHandler = iconHandler
    }
  }
  themePlugin.iconHandler = iconHandler
  return themePlugin
}

/**
 * handles icon props — adds icons to registry and fetches missing icons
 * @param iconName - The string name of the icon
 * @public
 */
export function handleIcons (iconLoader?: FormKitIconLoader): FormKitIconLoader {
  return (iconName: string) => {
    const icon = iconRegistry[iconName]
    if (icon || iconName in iconRegistry) {
      return icon
    }
    const loadedIcon = typeof iconLoader === 'function' ? iconLoader(iconName) : getRemoteIcon(iconName)
    if (loadedIcon instanceof Promise) {
      return loadedIcon.then((iconString) => {
        iconRegistry[iconName] = iconString
        return iconString
      }).catch(() => {
        return undefined
      })
    }
   iconRegistry[iconName] = loadedIcon
   return loadedIcon
  }
}

/**
 * Attempts to fetch a remote icon from the FormKit CDN
 * @param iconName - The string name of the icon
 * @public
 */
async function getRemoteIcon(iconName: string): Promise<string | undefined> {
  const icon = await fetch(`https://cdn.jsdelivr.net/npm/@formkit/icons@1.0.0-beta.9-icon-preview/dist/icons/${iconName}.svg`)
    .then(r => r.text())
    .catch(e => console.error(e))
  if (icon && icon.startsWith('<svg')) {
    return icon
  }
  return undefined
}
