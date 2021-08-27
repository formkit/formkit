import ReactDom from 'react-dom'
import React from 'react'
import { createApp } from 'vue'
import vueApp from './vue/Examples'
import reactApp from './react/Examples'

const app = createApp(vueApp)
app.mount('#vue-app')

ReactDom.render(
  React.createElement(reactApp),
  document.getElementById('react-app')
)
