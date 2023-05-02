import { FormKitNode, FormKitPlugin } from '@formkit/core'
import { z } from 'zod'
// import { undefine } from '@formkit/utils'

/**
 * Creates a new Zod schema plugin.
 *
 * @param zodSchema - A Zod schema to validate the form against.
 * @param submitCallback - A callback to run when the form is submitted and it passes validation.
 *
 * @returns A tuple of a {@link @formkit/core#FormKitPlugin | FormKitPlugin} and a submit handler.
 *
 * @public
 */
export function createZodPlugin<Z extends z.ZodTypeAny>(
  zodSchema: Z,
  submitCallback: (payload: z.infer<typeof zodSchema>) => void | Promise<void>
): [FormKitPlugin, (payload: any, node: FormKitNode) => void] {
  // The Zod plugin — maps zod schema to validation rules on
  // matching FormKit nodes.
  const zodPlugin = (node: FormKitNode) => {
    console.log('zodPlugin from src', node)
    return false
  }

  // The submit handler — validates the payload against the zod schema
  // and then passes the data to the user's submit callback.
  async function submitHandler(payload: any, node: FormKitNode) {
    const zodResults = await zodSchema.safeParseAsync(payload)
    if (!zodResults.success) {
      setFormErrors(zodResults.error, node)
    } else {
      await submitCallback(zodResults as z.infer<Z>)
    }
  }

  // Sets the form errors on the correct nodes.
  function setFormErrors(zodErrors: z.ZodError, node: FormKitNode) {
    const allErrors = buildFormErrors(zodErrors)
    const inputErrors = Object.entries(allErrors).reduce(
      (acc, [path, message]) => {
        const exists = !!node.at(path)
        if (exists) {
          delete allErrors[path]
          acc[path] = message
          return acc
        }
        return acc
      },
      {} as Record<string, string>
    )
    const formErrors = Object.keys(allErrors).map((error) => {
      return `${error}: ${allErrors[error]}`
    })
    node.setErrors(inputErrors, formErrors)
  }

  // Builds a FormKit errors object from the zod error object.
  function buildFormErrors(zodError: z.ZodError): Record<string, string> {
    const formErrors: Record<string, string> = {}
    zodError.errors.forEach((error) => {
      const path = error.path.join('.')
      formErrors[path] = error.message
    })
    return formErrors
  }

  return [zodPlugin, submitHandler]
}
