import { defineComponent, h, getCurrentInstance } from 'vue'

export default defineComponent({
  setup(_props, options) {
    const instance = getCurrentInstance()
    const n = instance?.appContext.config.globalProperties.$formkit.nodeConfig
    return () =>
      h('div', [
        'FormKit Generator: ',
        String(options.attrs.type) || 'foobar',
        String(n),
      ])
  },
})
