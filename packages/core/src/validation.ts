import createNode from "./node"

export default function validation(node)
{
  node.preCommit((node, next) => )
}


createNode({
  plugins: [validation]
})

createNode()
  .use(validation)
