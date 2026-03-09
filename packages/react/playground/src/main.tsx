import { createRoot } from 'react-dom/client'
import { App } from './App'
import './styles.css'

const root = document.getElementById('react-app')

if (!root) {
  throw new Error('Missing #react-app root element')
}

createRoot(root).render(<App />)
