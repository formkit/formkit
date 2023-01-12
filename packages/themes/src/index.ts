import {
  FORMKIT_VERSION,
  FormKitNode,
  FormKitClasses,
  FormKitEvent,
} from '@formkit/core'

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
  (iconName: string): string | undefined | Promise<string | undefined>
}

/**
 * A function that returns a remote url for retrieving an SVG icon by name
 * @public
 */
export interface FormKitIconLoaderUrl {
  (iconName: string): string | undefined
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
  const family = node.props.family
  let classList = ''
  if (classesByType.global) {
    classList += classesByType.global + ' '
  }
  if (classesByType[`family:${family}`]) {
    classList += classesByType[`family:${family}`] + ' '
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
let documentStyles: Record<any, any> | undefined = undefined
let documentThemeLinkTag: HTMLElement | null = null

/**
 * Stores the state of theme loading
 */
let themeDidLoad: (value?: unknown) => void
let themeHasLoaded = false
let themeWasRequested = false
const themeLoaded = new Promise<void>((res) => {
  themeDidLoad = () => {
    themeHasLoaded = true
    res()
  }
})

/**
 * Check if we are client-side
 */
const isClient = typeof window !== 'undefined' && typeof fetch !== 'undefined'
documentStyles = isClient
  ? getComputedStyle(document.documentElement)
  : undefined

/**
 * The FormKit icon Registry - a global record of loaded icons.
 * @public
 */
export const iconRegistry: Record<string, string | undefined> = {}

/**
 * A collection of existing icon requests to avoid duplicate fetching
 */
const iconRequests: Record<string, any> = {}

/**
 * Creates the theme plugin based on a given theme name
 * @param theme - The name or id of the theme to apply
 * @param icons - Icons you want to add to the global icon registry
 * @param iconLoader - A function that handles loading an icon when it is not found in the registry
 * @public
 */
export function createThemePlugin(
  theme?: string,
  icons?: Record<string, string | undefined>,
  iconLoaderUrl?: FormKitIconLoaderUrl,
  iconLoader?: FormKitIconLoader
): (node: FormKitNode) => any {
  if (icons) {
    // add any user-provided icons to the registry
    Object.assign(iconRegistry, icons)
  }

  // if we have a theme declared, request it
  if (
    isClient &&
    !themeWasRequested &&
    documentStyles?.getPropertyValue('--formkit-theme')
  ) {
    // we have the theme loaded locally
    themeDidLoad()
    themeWasRequested = true
  } else if (theme && !themeWasRequested && isClient) {
    // we have the theme name but need to request it remotely
    loadTheme(theme)
  } else if (!themeWasRequested && isClient) {
    // we don't have a discoverable theme, so don't wait for it
    themeDidLoad()
  }

  const themePlugin = function themePlugin(node: FormKitNode) {
    // register the icon handler, and override with local prop value if it exists
    node.addProps(['iconLoader', 'iconLoaderUrl'])
    node.props.iconHandler = createIconHandler(
      node.props?.iconLoader ? node.props.iconLoader : iconLoader,
      node.props?.iconLoaderUrl ? node.props.iconLoaderUrl : iconLoaderUrl
    )

    node.on('created', () => {
      loadIconPropIcons(node, node.props.iconHandler)
      // set up the `-icon` click handlers
      if (node?.context?.handlers) {
        node.context.handlers.iconClick = (
          sectionKey: string
        ): ((e: MouseEvent) => void) | void => {
          const clickHandlerProp = `on${sectionKey
            .charAt(0)
            .toUpperCase()}${sectionKey.slice(1)}IconClick`
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

  themePlugin.iconHandler = createIconHandler(iconLoader, iconLoaderUrl)
  return themePlugin
}

/**
 * Loads a FormKit theme
 */
function loadTheme(theme: string) {
  if (!theme || !isClient || typeof getComputedStyle !== 'function') {
    // if we're not client-side then bail
    return
  }

  // since we're client-side, flag that we've requested the theme
  themeWasRequested = true

  documentThemeLinkTag = document.getElementById('formkit-theme')

  // retrieve document styles on plugin creation when the window object exists

  if (
    theme &&
    // if we have a window object
    isClient &&
    // we don't have an existing theme OR the theme being set up is different
    ((!documentStyles?.getPropertyValue('--formkit-theme') &&
      !documentThemeLinkTag) ||
      (documentThemeLinkTag?.getAttribute('data-theme') &&
        documentThemeLinkTag?.getAttribute('data-theme') !== theme))
  ) {
    // if for some reason we didn't overwrite the __FKV__ token during publish
    // then use the `latest` tag for CDN fetching. (this applies to local dev as well)
    const formkitVersion = FORMKIT_VERSION.startsWith('__')
      ? 'latest'
      : FORMKIT_VERSION
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
}

/**
 * Returns a function responsible for loading an icon by name
 * @param iconLoader - a function for loading an icon when it's not found in the iconRegistry
 * @public
 */
export function createIconHandler(
  iconLoader?: FormKitIconLoader,
  iconLoaderUrl?: FormKitIconLoaderUrl
): FormKitIconLoader {
  return (
    iconName: string | boolean
  ): string | undefined | Promise<string | undefined> => {
    if (typeof iconName === 'boolean') {
      return // do nothing if we're dealing with a boolean
    }
    // if we're dealing with an inline SVG, just use it as-is
    if (iconName.startsWith('<svg')) {
      return iconName
    }
    if (typeof iconName !== 'string') return // bail if we got something that wasn't a boolean or string

    // check if we've already loaded the icon before
    const icon = iconRegistry[iconName]

    // is this a default icon that should only load from a stylesheet?
    const isDefault = iconName.startsWith('default:')
    iconName = isDefault ? iconName.split(':')[1] : iconName

    let loadedIcon: string | undefined | Promise<string | undefined> = undefined
    if (icon || iconName in iconRegistry) {
      return iconRegistry[iconName]
    } else if (!iconRequests[iconName]) {
      loadedIcon = getIconFromStylesheet(iconName)
      loadedIcon =
        isClient && typeof loadedIcon === 'undefined'
          ? Promise.resolve(loadedIcon)
          : loadedIcon
      if (loadedIcon instanceof Promise) {
        iconRequests[iconName] = loadedIcon
          .then((iconValue) => {
            if (!iconValue && typeof iconName === 'string' && !isDefault) {
              return (loadedIcon =
                typeof iconLoader === 'function'
                  ? iconLoader(iconName)
                  : getRemoteIcon(iconName, iconLoaderUrl))
            }
            return iconValue
          })
          .then((finalIcon) => {
            if (typeof iconName === 'string') {
              iconRegistry[isDefault ? `default:${iconName}` : iconName] =
                finalIcon
            }
            return finalIcon
          })
      } else if (typeof loadedIcon === 'string') {
        iconRegistry[isDefault ? `default:${iconName}` : iconName] = loadedIcon
        return loadedIcon
      }
    }
    return iconRequests[iconName]
  }
}

function getIconFromStylesheet(
  iconName: string
): string | undefined | Promise<string | undefined> {
  if (!isClient) return
  if (themeHasLoaded) {
    return loadStylesheetIcon(iconName)
  } else {
    return themeLoaded.then(() => {
      return loadStylesheetIcon(iconName)
    })
  }
}

function loadStylesheetIcon(iconName: string) {
  const cssVarIcon = documentStyles?.getPropertyValue(`--fk-icon-${iconName}`)
  if (cssVarIcon) {
    // if we have a matching icon in the CSS properties, then decode it
    const icon: string = atob(cssVarIcon)
    if (icon.startsWith('<svg')) {
      iconRegistry[iconName] = icon
      return icon
    }
  }
  return undefined
}

/**
 * Attempts to fetch a remote icon from the FormKit CDN
 * @param iconName - The string name of the icon
 * @public
 */
function getRemoteIcon(
  iconName: string,
  iconLoaderUrl?: FormKitIconLoaderUrl
): Promise<string | undefined> | undefined {
  const formkitVersion = FORMKIT_VERSION.startsWith('__')
    ? 'latest'
    : FORMKIT_VERSION
  const fetchUrl =
    typeof iconLoaderUrl === 'function'
      ? iconLoaderUrl(iconName)
      : `https://cdn.jsdelivr.net/npm/@formkit/icons@${formkitVersion}/dist/icons/${iconName}.svg`
  if (!isClient) return undefined
  return fetch(`${fetchUrl}`)
    .then(async (r) => {
      const icon = await r.text()
      if (icon.startsWith('<svg')) {
        return icon
      }
      return undefined
    })
    .catch((e) => {
      console.error(e)
      return undefined
    })
}

/**
 * Loads icons for the matching `-icon` props on a given node
 */
function loadIconPropIcons(
  node: FormKitNode,
  iconHandler: FormKitIconLoader
): void {
  const iconRegex = /^[a-zA-Z-]+(?:-icon|Icon)$/
  const iconProps = Object.keys(node.props).filter((prop) => {
    return iconRegex.test(prop)
  })
  iconProps.forEach((sectionKey) => {
    return loadPropIcon(node, iconHandler, sectionKey)
  })
}

/**
 * Loads an icon from an icon-prop declaration eg. suffix-icon="settings"
 */
function loadPropIcon(
  node: FormKitNode,
  iconHandler: FormKitIconLoader,
  sectionKey: string
): Promise<void> | void {
  const iconName = node.props[sectionKey]
  const loadedIcon = iconHandler(iconName)
  const rawIconProp = `_raw${sectionKey
    .charAt(0)
    .toUpperCase()}${sectionKey.slice(1)}`
  const clickHandlerProp = `on${sectionKey
    .charAt(0)
    .toUpperCase()}${sectionKey.slice(1)}Click`
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
  const iconHandler = node?.props?.iconHandler
  const sectionKey = event.name.split(':')[1]
  const rawIconProp = `_raw${sectionKey
    .charAt(0)
    .toUpperCase()}${sectionKey.slice(1)}`

  if (iconHandler && typeof iconHandler === 'function') {
    const loadedIcon = iconHandler(iconName)

    if (loadedIcon instanceof Promise) {
      return loadedIcon.then((svg) => {
        node.props[rawIconProp] = svg
      })
    } else {
      node.props[rawIconProp] = loadedIcon
    }
  }
}
