const vueImportUrl =
  new URL(import.meta.url).searchParams.get('src') ||
  'https://cdn.jsdelivr.net/npm/vue@next/+esm'
const {
  defineComponent,
  getCurrentInstance,
  watch,
  watchEffect,
  reactive,
  ref,
  createTextVNode,
  resolveComponent,
  h,
  inject,
  provide,
  onUnmounted,
  markRaw,
  computed,
} = await import(vueImportUrl)
export {
  defineComponent,
  getCurrentInstance,
  watch,
  watchEffect,
  reactive,
  ref,
  createTextVNode,
  resolveComponent,
  h,
  inject,
  provide,
  onUnmounted,
  markRaw,
  computed,
}
