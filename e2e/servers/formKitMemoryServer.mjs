import { createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { plugin, defaultConfig } from '@formkit/vue'
import http from 'http'

const template = `<FormKit type="form">
  <FormKit
    type="text"
    name="name"
    id="name"
    validation="required|not:Admin"
    label="Name"
    help="Enter your character's full name"
    placeholder="“Scarlet Sword”"
  />

  <FormKit
    type="select"
    label="Class"
    name="class"
    id="class"
    placeholder="Select a class"
    :options="['Warrior', 'Mage', 'Assassin']"
  />

  <FormKit
    type="range"
    name="strength"
    id="strength"
    label="Strength"
    value="5"
    validation="min:2|max:9"
    validation-visibility="live"
    min="1"
    max="10"
    step="1"
    help="How many strength points should this character have?"
  />

  <FormKit
    type="range"
    name="skill"
    id="skill"
    validation="required|max:10"
    label="Skill"
    value="5"
    min="1"
    max="10"
    step="1"
    help="How much skill points to start with"
  />

  <FormKit
    type="range"
    name="dexterity"
    id="dexterity"
    validation="required|max:10"
    label="Dexterity"
    value="5"
    min="1"
    max="10"
    step="1"
    help="How much dexterity points to start with"
  />
</FormKit>`

const server = http.createServer((req, res) => {
  if (req.url === '/favicon.ico') {
    res.statusCode = 404
    res.end()
    return
  }
  let app = createSSRApp({
    template,
  })

  app.use(plugin, defaultConfig)

  renderToString(app).then((html) => {
    if (typeof globalThis.gc === 'function') globalThis.gc() // eslint-disable-line no-undef
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
