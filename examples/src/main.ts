import { createApp } from 'vue'
import { plugin, defaultConfig } from '../../packages/vue/src/index'
import '../../packages/themes/src/genesis/index'
import vueApp from './vue/Examples.vue'

const app = createApp(vueApp).use(plugin, defaultConfig)
app.mount('#vue-app')

// import ReactDom from 'react-dom'
// import React from 'react'
// import reactApp from './react/Examples'
// ReactDom.render(
//   React.createElement(reactApp),
//   document.getElementById('react-app')
// )
