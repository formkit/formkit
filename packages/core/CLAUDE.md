# FormKit Core Package

## Config/Props Hierarchy

Node `config` values are exposed as `node.props`. They are hierarchical:

- If a parent has `node.config.foobar`, then child `node.props.foobar` exists and references the parent's value
- Events can be bound (e.g., `node.on('prop:foobar', ...)`) so children are notified when a parent's config changes
- This is how locale changes propagate: setting `node.config.locale` on a root node triggers `prop:locale` events on all descendants
