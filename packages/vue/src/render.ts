import {
  createParser,
  FormKitSchemaNode,
  FormKitSchemaContext,
} from '@formkit/schema'
import { h, VNode, Component } from 'vue'
import rootNode from './node'

const vueParser = createParser<Component, VNode>(h, rootNode)

export function createElements(
  schema: FormKitSchemaNode[],
  context: FormKitSchemaContext<Component>
): Array<VNode | string | null> {
  return vueParser(schema, context)
}
