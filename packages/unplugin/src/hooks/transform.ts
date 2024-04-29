import type { ResolvedOptions } from '../types'
import type { UnpluginOptions } from 'unplugin'
import { usedComponents } from '../utils/vue'

export function createTransform(
  opts: ResolvedOptions
): Exclude<UnpluginOptions['transform'], undefined> {
  const HAS_COMPONENTS_RE = new RegExp(
    `(?:${opts.components.map((c) => c.name).join('|')})`
  )

  return async function transform(code) {
    // Quick checks to early return:
    if (!Array.isArray(opts.components)) return null

    // If our component strings are not found at all in this file, we can skip it.
    if (!HAS_COMPONENTS_RE.test(code)) return null
    const ast = opts.parse(code)
    const components = usedComponents(opts, ast, opts.components, true)
    if (components.length === 0) return null
    for (const component of components) {
      if (component.codeMod) await component.codeMod(component)
    }
    return opts.generate(ast)
  }
}
