import { FormKitContext, FormKitNode, FormKitPlugin } from './node'

/**
 * Adds a plugin to the node, it’s children, and executes it.
 * @param  {FormKitContext} context
 * @param  {FormKitNode} node
 * @param  {FormKitPlugin} plugin
 */
export function usePlugin(
  node: FormKitNode,
  context: FormKitContext,
  plugin: FormKitPlugin
) {
  context.plugins.add(plugin)
  if (plugin(node) !== false) {
    node.children.forEach((c) => c.use(plugin))
  }
  return node
}
