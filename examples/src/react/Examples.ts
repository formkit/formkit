import React, { FunctionComponent } from 'react'
import { createElements } from '../../../packages/react/src/render'
import schema from '../schema'

const parsedSchema = createElements(schema, { library: {}, nodes: {} })

const reactApp: FunctionComponent = function () {
  return React.createElement(React.Fragment, null, parsedSchema)
}

export default reactApp
