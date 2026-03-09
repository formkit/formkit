import React from 'react'
import { renderToString } from 'react-dom/server'
import http from 'http'
import {
  FormKit,
  FormKitProvider,
  defaultConfig,
} from '../../packages/react/dist/index.mjs'

function App() {
  return React.createElement(
    FormKitProvider,
    { config: defaultConfig() },
    React.createElement(
      FormKit,
      { type: 'form' },
      React.createElement(FormKit, {
        type: 'text',
        name: 'name',
        id: 'name',
        validation: 'required|not:Admin',
        label: 'Name',
        help: "Enter your character's full name",
        placeholder: 'Scarlet Sword',
      }),
      React.createElement(FormKit, {
        type: 'select',
        label: 'Class',
        name: 'class',
        id: 'class',
        placeholder: 'Select a class',
        options: ['Warrior', 'Mage', 'Assassin'],
      }),
      React.createElement(FormKit, {
        type: 'range',
        name: 'strength',
        id: 'strength',
        label: 'Strength',
        value: '5',
        validation: 'min:2|max:9',
        validationVisibility: 'live',
        min: '1',
        max: '10',
        step: '1',
        help: 'How many strength points should this character have?',
      }),
      React.createElement(FormKit, {
        type: 'range',
        name: 'skill',
        id: 'skill',
        validation: 'required|max:10',
        label: 'Skill',
        value: '5',
        min: '1',
        max: '10',
        step: '1',
        help: 'How much skill points to start with',
      }),
      React.createElement(FormKit, {
        type: 'range',
        name: 'dexterity',
        id: 'dexterity',
        validation: 'required|max:10',
        label: 'Dexterity',
        value: '5',
        min: '1',
        max: '10',
        step: '1',
        help: 'How much dexterity points to start with',
      })
    )
  )
}

const server = http.createServer((req, res) => {
  if (req.url === '/favicon.ico') {
    res.statusCode = 404
    res.end()
    return
  }

  const html = renderToString(React.createElement(App))
  if (typeof globalThis.gc === 'function') globalThis.gc() // eslint-disable-line no-undef

  res.statusCode = 200
  res.setHeader('Content-Type', 'text/html')
  res.end(`<!DOCTYPE html>
  <html>
    Memory used: <input value="${
      Math.round(process.memoryUsage().heapUsed / 1000 / 100) / 10
    }">Mb
    <br>
    <div id="app">${html}</div>
  </html>`)
})

server.listen(8788, 'localhost', () => {
  console.log('Server started: http://localhost:8788')
})
