import MagicString from 'magic-string'
import { createUnplugin } from 'unplugin'
import { unpluginPureFactory } from 'unplugin-pure'

const toFunction = (functionOrValue) => {
  if (typeof functionOrValue === 'function') return functionOrValue
  return () => functionOrValue
}

const escape = (str) => str.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&')

const longest = (a, b) => b.length - a.length

/**
 * Transformer based on esbuild-plugin-replace.
 * @param - options key value pairs to replace
 * @returns
 */
function unpluginReplaceFactory(options) {
  const functionValues = mapToFunctions(options)
  const keys = Object.keys(functionValues).sort(longest).map(escape)
  const { delimiters } = options
  const pattern = delimiters
    ? new RegExp(
        `${escape(delimiters[0])}(${keys.join('|')})${escape(delimiters[1])}`,
        'g'
      )
    : new RegExp(`\\b(${keys.join('|')})\\b`, 'g')

  return (code, id) => {
    // If this is a stub, ignore it:
    if (code && code.includes('const _module = jiti(null, {')) return null

    const magicString = new MagicString(code)
    let match = null

    while ((match = pattern.exec(code))) {
      const start = match.index
      const end = start + match[0].length
      const replacement = String(functionValues[match[1]](id))
      magicString.overwrite(start, end, replacement)
    }
    return { code: magicString.toString(), map: null }
  }
}

const mapToFunctions = (options) => {
  const values = options.values
    ? Object.assign({}, options.values)
    : Object.assign({}, options)
  delete values.delimiters
  delete values.include
  delete values.exclude

  return Object.keys(values).reduce((fns, key) => {
    const functions = Object.assign({}, fns)
    functions[key] = toFunction(values[key])
    return functions
  }, {})
}

/**
 * Esbuild only performs a single transform per run since it uses the onLoad
 * hook which is only executed on initial load of an id. To get around this we
 * use a single unplugin and pipe the resulting code output to the transform
 * functions of other unplugin plugins.
 * See: https://github.com/unjs/unplugin/issues/126
 * @returns
 */
const unpluginFactory = (options) => {
  return {
    name: 'transform-pipe',
    transform(code, id) {
      const transformReplace = unpluginReplaceFactory(options.replace)
      const postReplace = transformReplace(code, id)

      if (postReplace) code = postReplace.code
      const { transform: transformPure } = unpluginPureFactory(options.pure)
      code = transformPure(code, id) ?? code
      return code
    },
  }
}

export default createUnplugin(unpluginFactory)
