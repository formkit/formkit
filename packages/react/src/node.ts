import { createNode, FormKitProps, FormKitNode } from '@formkit/core'
import { FormKitSchemaContext, FormKitSchemaNode } from '@formkit/schema'
import { extend } from '@formkit/utils'
import React, {
  ReactElement,
  useEffect,
  useState,
  FunctionComponent,
  ClassicComponent,
} from 'react'
import { createElements } from './render'

type ReactComponent = FunctionComponent<any> | ClassicComponent<any>

interface NodeProps {
  id: string
  type: 'input' | 'group' | 'list'
  name?: string
  value?: any
  props: Partial<FormKitProps>
  children: FormKitSchemaNode[]
  schemaContext: FormKitSchemaContext<ReactComponent>
}

const nodeComponent: FunctionComponent<NodeProps> = function (
  props: NodeProps
): ReactElement {
  const [node] = useState<FormKitNode<any>>(() =>
    createNode({
      type: ['input', 'group', 'list'].includes(props.type)
        ? props.type
        : 'input',
      name: props.name,
      value: props.value as any,
      props: props.props,
    })
  )

  const [reactiveNode, setReactiveNode] = useState(() => ({
    __POJO__: false,
    value: props.value,
    props: props.props,
    name: props.name,
    input: (event: InputEvent) =>
      node?.input((event.target as HTMLInputElement).value),
    node,
  }))

  useEffect(() => {
    node.on('commit', ({ payload }) => {
      setReactiveNode({ ...reactiveNode, value: payload })
    })
  }, [node])

  return React.createElement(
    React.Fragment,
    null,
    createElements(
      props.children,
      extend(props.schemaContext, {
        nodes: { [props.id]: reactiveNode },
      }) as FormKitSchemaContext<ReactComponent>
    )
  )
}

export default nodeComponent
