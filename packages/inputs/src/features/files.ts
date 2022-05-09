import { FormKitNode } from '@formkit/core'
import localize from './localize'
import { FormKitFileValue } from '../inputs'

declare global {
  interface Window {
    _FormKit_File_Drop: boolean
  }
}

const isBrowser = typeof window !== 'undefined'

/**
 * Remove the data-file-hover attribute from the target.
 * @param e - Event
 */
function removeHover(e: Event) {
  if (
    e.target instanceof HTMLElement &&
    e.target.hasAttribute('data-file-hover')
  ) {
    e.target.removeAttribute('data-file-hover')
  }
}

/**
 * Prevent stray drag/drop events from navigating the window.
 * @param e - Event
 * @public
 */
function preventStrayDrop(type: string, e: Event) {
  if (!(e.target instanceof HTMLInputElement)) {
    e.preventDefault()
  } else if (type === 'dragover') {
    e.target.setAttribute('data-file-hover', 'true')
  }
  if (type === 'drop') {
    removeHover(e)
  }
}

export default function files(node: FormKitNode): void {
  // Localize our content:
  localize('noFiles', 'Select file')(node)
  localize('removeAll', 'Remove all')(node)
  localize('remove')(node)

  if (isBrowser) {
    if (!window._FormKit_File_Drop) {
      window.addEventListener(
        'dragover',
        preventStrayDrop.bind(null, 'dragover')
      )
      window.addEventListener('drop', preventStrayDrop.bind(null, 'drop'))
      window.addEventListener('dragleave', removeHover)
      window._FormKit_File_Drop = true
    }
  }

  node.on('created', () => {
    if (!Array.isArray(node.value)) {
      node.input([], false)
    }
    if (!node.context) return

    node.context.handlers.resetFiles = (e: Event) => {
      e.preventDefault()
      node.input([])
      if (node.props.id && isBrowser) {
        const el = document.getElementById(node.props.id)
        if (el) (el as HTMLInputElement).value = ''
      }
    }

    node.context.handlers.files = (e: Event) => {
      const files: FormKitFileValue = []
      if (e.target instanceof HTMLInputElement && e.target.files) {
        for (let i = 0; i < e.target.files.length; i++) {
          let file
          if ((file = e.target.files.item(i))) {
            files.push({ name: file.name, file })
          }
        }
        node.input(files)
      }
      if (node.context) node.context.files = files
      // Call the original listener if there is one.

      if (typeof node.props.attrs?.onChange === 'function') {
        node.props.attrs?.onChange(e)
      }
    }
  })
}
