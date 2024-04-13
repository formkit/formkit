import { defineNuxtPlugin } from '#imports'

export default defineNuxtPlugin(() => {
  // @ts-expect-error untyped global variable
  globalThis.__DEV__ = true
})
