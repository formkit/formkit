import { createApp, h, nextTick, ref } from 'vue'
import { plugin, defaultConfig, FormKit } from '@formkit/vue'
import { getNode } from '@formkit/core'

const raf = () => new Promise((r) => requestAnimationFrame(() => r()))

function scenario(name, n) {
  if (name === 'native') {
    const vals = ref(Array.from({ length: n }, () => ''))
    return () => h('form', vals.value.map((_, i) => h('input', { value: vals.value[i], onInput: (e) => (vals.value[i] = e.target.value) })))
  }
  if (name === 'flat' || name === 'validated') {
    const extra = name === 'validated' ? { validation: 'required|length:2' } : {}
    return () => h(FormKit, { type: 'form', id: 'bench', actions: false }, () =>
      Array.from({ length: n }, (_, i) => h(FormKit, { type: 'text', name: `f${i}`, label: `Field ${i}`, ...extra })))
  }
  if (name === 'rows') {
    const rows = Math.round(n / 10)
    return () => h(FormKit, { type: 'form', id: 'bench', actions: false }, () =>
      h(FormKit, { type: 'list', name: 'rows', value: Array.from({ length: rows }, () => ({})) }, () =>
        Array.from({ length: rows }, (_, r) => h(FormKit, { type: 'group', key: r, index: r }, () =>
          Array.from({ length: 10 }, (_, c) => h(FormKit, { type: 'text', name: `c${c}`, label: `Cell ${c}` }))))))
  }
}

window.runBench = async (name, n) => {
  document.getElementById('app').innerHTML = '<div id="mount"></div>'
  const app = createApp({ render: scenario(name, n) })
  app.use(plugin, defaultConfig())
  const t0 = performance.now()
  app.mount('#mount')
  await nextTick()
  const form = getNode('bench')
  if (form) await form.settled
  await raf(); await raf()
  const ms = performance.now() - t0
  const inputs = document.querySelectorAll('#mount input').length
  app.unmount()
  return { ms, inputs }
}
window.benchReady = true
