import { createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { plugin, defaultConfig } from '@formkit/vue'
import http from 'http'

const template = `<div>
  <div class="sample">
    <label for="sample-1">Sample 1</label>
    <input type="text" id="sample-1" />
  </div>
  <div class="sample">
  <label for="sample-2">Sample 2</label>
  <input type="text" id="sample-2" />
</div>
<div class="sample">
<label for="sample-3">Sample 3</label>
<input type="text" id="sample-3" />
</div>
<div class="sample">
<label for="sample-4">Sample 4</label>
<input type="text" id="sample-4" />
</div>
<div class="sample">
<label for="sample-5">Sample 5</label>
<input type="text" id="sample-5" />
</div>
</div>`

const server = http.createServer((req, res) => {
  const app = createSSRApp({
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
})

server.listen(8585, 'localhost', () => {
  console.log('Server started: http://localhost:8585')
})
