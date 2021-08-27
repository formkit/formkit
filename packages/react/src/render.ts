import React, { FunctionComponent, ClassicComponent } from 'react'
import {
  createParser,
  FormKitSchemaNode,
  FormKitSchemaContext,
} from '@formkit/schema'
import rootNode from './node'

type ReactComponent = FunctionComponent<any> | ClassicComponent<any>

const reactParser = createParser<ReactComponent, React.ReactNode>(
  React.createElement,
  rootNode
)

export function createElements(
  schema: FormKitSchemaNode[],
  context: FormKitSchemaContext<ReactComponent>
): Array<React.ReactNode | string | null> {
  return reactParser(schema, context)
}
