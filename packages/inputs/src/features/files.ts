import { FormKitNode } from '@formkit/core'
import localize from './localize'
import { FormKitFileValue } from '../index'

declare global {
  interface Window {
    _FormKit_File_Drop: boolean
  }
}

const isBrowser = typeof window !== 'undefined'

/**
 * Remove the data-file-hover attribute from the target.
 *
 * @param e - Event
 *
 * @internal
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
 *
 * @param e - Event
 *
 * @internal
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

/**
 * A feature to add file handling support to an input.
 *
 * @param node - A {@link @formkit/core#FormKitNode | FormKitNode}.
 *
 * @public
 */
export default function files(node: FormKitNode): void {
  // Localize our content:
  localize('noFiles', 'Select file')(node)
  localize('removeAll', 'Remove all')(node)
  localize('remove')(node)
  node.addProps(['_hasMultipleFiles'])

  const setupFileDropListeners = () => {
    if (window._FormKit_File_Drop) return;

    const dragoverHandler = preventStrayDrop.bind(null, 'dragover');
    const dropHandler = preventStrayDrop.bind(null, 'drop');

    window.addEventListener('dragover', dragoverHandler);
    window.addEventListener('drop', dropHandler);
    window.addEventListener('dragleave', removeHover);

    window._FormKit_File_Drop = true;

    // Return an object implementing Symbol.dispose for cleanup
    return {
      [Symbol.dispose]() {
        // Remove all the listeners when disposed
        window.removeEventListener('dragover', dragoverHandler);
        window.removeEventListener('drop', dropHandler);
        window.removeEventListener('dragleave', removeHover);
        window._FormKit_File_Drop = false; // Reset the flag
      }
    };
  }

  if (isBrowser) {
    setupFileDropListeners()
  }
  node.hook.input((value, next) => next(Array.isArray(value) ? value : []))
  node.on('input', ({ payload: value }) => {
    node.props._hasMultipleFiles =
      Array.isArray(value) && value.length > 1 ? true : undefined
  })

  node.on('reset', () => {
    if (node.props.id && isBrowser) {
      const el = document.getElementById(node.props.id)
      if (el) (el as HTMLInputElement).value = ''
    }
  })

  node.on('created', () => {
    if (!Array.isArray(node.value)) node.input([], false)

    if (!node.context) return

    node.context.handlers.resetFiles = (e: Event) => {
      e.preventDefault()
      node.input([])
      if (node.props.id && isBrowser) {
        const el = document.getElementById(node.props.id)
        if (el) (el as HTMLInputElement).value = ''
        el?.focus()
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
