import { createApp, h, nextTick, ref } from 'vue'
import { plugin, defaultConfig, FormKit } from '@formkit/vue'
import { getNode } from '@formkit/core'
import { createElement as rh } from 'react'
import { createRoot } from 'react-dom/client'
import {
  FormKit as RFormKit,
  FormKitProvider,
  defaultConfig as reactDefaultConfig,
} from '@formkit/react'

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

function reactScenario(name, n) {
  if (name === 'react-flat' || name === 'react-validated') {
    const extra = name === 'react-validated' ? { validation: 'required|length:2' } : {}
    return rh(RFormKit, { type: 'form', id: 'bench', actions: false },
      Array.from({ length: n }, (_, i) => rh(RFormKit, { key: i, type: 'text', name: `f${i}`, label: `Field ${i}`, ...extra })))
  }
  if (name === 'react-rows') {
    const rows = Math.round(n / 10)
    return rh(RFormKit, { type: 'form', id: 'bench', actions: false },
      rh(RFormKit, { type: 'list', name: 'rows', value: Array.from({ length: rows }, () => ({})) },
        Array.from({ length: rows }, (_, r) => rh(RFormKit, { type: 'group', key: r, index: r },
          Array.from({ length: 10 }, (_, c) => rh(RFormKit, { key: c, type: 'text', name: `c${c}`, label: `Cell ${c}` }))))))
  }
}

async function runReactBench(name, n) {
  document.getElementById('app').innerHTML = '<div id="mount"></div>'
  const root = createRoot(document.getElementById('mount'))
  const t0 = performance.now()
  root.render(rh(FormKitProvider, { config: reactDefaultConfig() }, reactScenario(name, n)))
  // Wait for React to commit the tree, then for FormKit to settle.
  while (!getNode('bench')) await new Promise((r) => setTimeout(r, 0))
  await getNode('bench').settled
  await raf(); await raf()
  const ms = performance.now() - t0
  const inputs = document.querySelectorAll('#mount input').length
  const u0 = performance.now()
  root.unmount()
  await raf()
  const unmountMs = performance.now() - u0
  return { ms, inputs, unmountMs }
}

window.runBench = async (name, n) => {
  if (name.startsWith('react-')) return runReactBench(name, n)
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
  const u0 = performance.now()
  app.unmount()
  await nextTick()
  await raf()
  const unmountMs = performance.now() - u0
  return { ms, inputs, unmountMs }
}
window.benchReady = true
