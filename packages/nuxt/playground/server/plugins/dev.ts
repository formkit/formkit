export default () => {
  // @ts-expect-error untyped global variable
  globalThis.__DEV__ = true
}
