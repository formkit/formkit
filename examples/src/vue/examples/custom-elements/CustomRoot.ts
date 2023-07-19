import CustomElementApp from './CustomElementApp.vue'
import { defineCustomElement, createApp, h, getCurrentInstance } from 'vue'
import { plugin, defaultConfig } from '@formkit/vue'

export default defineCustomElement({
  styles: [
    `
      :host {
        all: initial;
        display: block;
      }
      .element-boundary {
        border: 1px solid blue;
        padding: 1rem;
      }
    `,
  ],
  setup() {
    const app = createApp(CustomElementApp)
    app.use(plugin, defaultConfig)

    const inst = getCurrentInstance()
    if (inst) {
      Object.assign((inst as any).appContext, app._context)
      Object.assign((inst as any).provides, app._context.provides)
    }

    return () => h(CustomElementApp)
  },
})
