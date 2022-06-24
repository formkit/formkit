import { FORMKIT_VERSION, FormKitNode, FormKitClasses, FormKitEvent } from '@formkit/core'

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
    if (prop in target) {
      // we have the icon so return it
      return target[prop]
    }
    const cssVarIcon = documentStyles.getPropertyValue(`--fk-icon-${prop}`)
    if (cssVarIcon) {
      // if we have a matching icon in the CSS properties, then decode it
      const icon: string = atob(cssVarIcon)
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
 * A collection of existing icon requests to avoid duplicate fetching
 */
const iconRequests: Record<string, any> = {}

/**
 * Creates the theme plugin based on a given theme name
 * @param theme - The name or id of the theme to apply
 * @param iconLoader - A function that handles loading an icon
 * @public
 */
export function createThemePlugin(
  theme?: string,
  icons?: Record<string, string | undefined>,
  iconLoader?: FormKitIconLoader,
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
    // if we have a theme declared, wait for it
    if (theme) {
      await themeLoaded
    }

    // register the icon handler, and override with local prop value if it exists
    node.addProps(['iconHandler'])
    if (
      typeof node.props.iconHandler === 'undefined' &&
      typeof node.config.iconLoader === 'undefined'
    ) {
      node.props.iconHandler = iconHandler
    } else if (typeof node.props.iconHandler === 'function') {
      node.props.iconHandler = node.props.iconHandler
    } else if (typeof node.config.iconLoader === 'function') {
      node.props.iconHandler = handleIcons(node.config.iconLoader)
    }
    loadIconPropIcons(node, node.props.iconHandler)

    node.on('created', () => {
      // set up the icon click handler
      if (node?.context?.handlers) {
        node.context.handlers.iconClick = (sectionKey: string): ((e: MouseEvent) => void) | void => {
          const clickHandlerProp = `on${sectionKey.charAt(0).toUpperCase()}${sectionKey.slice(1)}IconClick`
          const handlerFunction = node.props[clickHandlerProp]
          if (handlerFunction && typeof handlerFunction === 'function') {
            return (e: MouseEvent) => {
              return handlerFunction(node, e)
            }
          }
          return undefined
        }
      }
    })
  }

  themePlugin.iconHandler = handleIcons(iconLoader)
  return themePlugin
}

/**
 * handles icon props — adds icons to registry and fetches missing icons
 * @param iconName - The string name of the icon
 * @public
 */
export function handleIcons (iconLoader?: FormKitIconLoader): FormKitIconLoader {
  return (iconName: string | boolean) => {
    if (typeof iconName === 'boolean') {
      return // do nothing if we're dealing with a boolean
    }
    // if we're dealing with an inline SVG, just use it as-is
    if (iconName.startsWith('<svg')) {
      return iconName
    }
    // check if we've already loaded the icon before
    const icon = iconRegistry[iconName]
    let loadedIcon:(string | undefined | Promise<string | undefined>) = undefined
    if (icon || iconName in iconRegistry) {
      return icon
    } else if (iconRequests[iconName] && iconRequests[iconName] instanceof Promise) {
      // if we are already awaiting a promise for this icon then return the existing promise
      loadedIcon = iconRequests[iconName]
    } else {
      // otherwise, load the icon with the user handler, or our default
      loadedIcon = typeof iconLoader === 'function' ? iconLoader(iconName) : getRemoteIcon(iconName)
    }
    // if the icon is being fetched remotely, return the promise
    if (loadedIcon instanceof Promise) {
      return loadedIcon.then((iconString) => {
        iconRegistry[iconName] = iconString
        return iconString
      }).catch(() => {
        return undefined
      })
    }
    // otherwise add the icon to the registry and return it immediately
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
  const formkitVersion = FORMKIT_VERSION.startsWith('__') ? 'latest' : FORMKIT_VERSION
  iconRequests[iconName] = fetch(`https://cdn.jsdelivr.net/npm/@formkit/icons@${formkitVersion}/dist/icons/${iconName}.svg`)
    .then(async (r) => {
      const icon = await r.text()
      if (icon.startsWith('<svg')) {
        return icon
      }
      return undefined
    })
    .catch(e => console.error(e))
  if (iconRequests[iconName] instanceof Promise) {
    return await iconRequests[iconName]
  }
  if (iconRequests[iconName] && iconRequests[iconName].startsWith('<svg')) {
    return iconRequests[iconName]
  }
  return undefined
}

/**
 * Loads icons for the matching `-icon` props on a given node
 */
function loadIconPropIcons(node: FormKitNode, iconLoader: FormKitIconLoader): void {
  const iconRegex = /^[a-zA-Z-]+(?:-icon|Icon)$/
  const iconProps = Object.keys(node.props).filter((prop) => {
    return iconRegex.test(prop)
  })
  iconProps.forEach((sectionKey) => {
    return loadPropIcon(node, iconLoader, sectionKey)
  })
}

/**
 * Loads an icon from an icon-prop declaration eg. suffix-icon="settings"
 */
function loadPropIcon(node: FormKitNode, iconLoader: FormKitIconLoader, sectionKey: string): Promise<void> | void {
  const iconName = node.props[sectionKey]
  const loadedIcon = iconLoader(iconName)
  const rawIconProp = `_raw${sectionKey.charAt(0).toUpperCase()}${sectionKey.slice(1)}`
  const clickHandlerProp = `on${sectionKey.charAt(0).toUpperCase()}${sectionKey.slice(1)}Click`
  node.addProps([rawIconProp, clickHandlerProp])
  // listen for changes to the icon prop
  node.on(`prop:${sectionKey}`, reloadIcon)
  if (loadedIcon instanceof Promise) {
    return loadedIcon.then((svg) => {
      node.props[rawIconProp] = svg
    })
  } else {
    node.props[rawIconProp] = loadedIcon
  }
  return
}

/**
 * reloads an icon when the prop value changes
 */
function reloadIcon(event: FormKitEvent): void | Promise<void> {
  const node = event.origin
  const iconName = event.payload
  const iconLoader = node?.context?.iconHandler
  const sectionKey = event.name.split(':')[1]
  const rawIconProp = `_raw${sectionKey.charAt(0).toUpperCase()}${sectionKey.slice(1)}`

  if (iconLoader && typeof iconLoader === 'function') {
    const loadedIcon = iconLoader(iconName)

    if (loadedIcon instanceof Promise) {
      return loadedIcon.then((svg) => {
        node.props[rawIconProp] = svg
      })
    } else {
      node.props[rawIconProp] = loadedIcon
    }
  }
}
