import { warn } from './errors'

/**
 * Submits a FormKit form programmatically.
 * @param id - The id of the form
 * @internal
 */
export function submitForm(id: string): void {
  const formElement = document.getElementById(id)
  if (formElement instanceof HTMLFormElement) {
    const event = new Event('submit', { cancelable: true, bubbles: true })
    formElement.dispatchEvent(event)
    return
  }
  warn(151, id)
}
