import { createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { plugin, defaultConfig } from '@formkit/vue'
import http from 'http'

const template = `<div>
  <FormKit label="Sample 1" type="text" validation="required" validation-visibility="live" />
  <FormKit label="Sample 2" type="text" validation="required" validation-visibility="live" />
  <FormKit label="Sample 3" type="text" validation="required" validation-visibility="live" />
  <FormKit label="Sample 4" type="text" validation="required" validation-visibility="live" />
</div>`

const server = http.createServer((req, res) => {
  let app = createSSRApp({
    template,
  })

  app.use(plugin, defaultConfig)

  renderToString(app).then((html) => {
    globalThis.gc() // eslint-disable-line no-undef
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/html')
    res.end(`<!DOCTYPE />
    <html>
      Memory used: <input value="${
        Math.round(process.memoryUsage().heapUsed / 1000 / 100) / 10
      }">Mb
      <br>
      <div id="app">${html}</div>
    </html>`)
  })

  app = null
})

server.listen(8686, 'localhost', () => {
  console.log('Server started: http://localhost:8686')
})
