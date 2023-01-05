import createDispatcher from './dispatcher'

/**
 * Describes the data passing through the error and warning handlers.
 *
 * @public
 */
export interface FormKitHandlerPayload {
  code: number
  data: any
  message?: string
}

/**
 * FormKit's global error handler.
 *
 * @public
 */
export const errorHandler = createDispatcher<FormKitHandlerPayload>()
/**
 * The default error handler just sets the error as the message.
 */
errorHandler((error, next) => {
  if (!error.message) error.message = String(`E${error.code}`)
  return next(error)
})

/**
 * FormKit's global warning handler.
 *
 * @public
 */
export const warningHandler = createDispatcher<FormKitHandlerPayload>()
warningHandler((warning, next) => {
  if (!warning.message) warning.message = String(`W${warning.code}`)
  const result = next(warning)
  if (console && typeof console.warn === 'function')
    console.warn(result.message)
  return result
})

/**
 * Globally emits a warning.
 *
 * @param code - The integer error code.
 * @param data - Usually an object of information to include.
 *
 * @public
 */
export function warn(code: number, data: any = {}): void {
  warningHandler.dispatch({ code, data })
}

/**
 * Emits an error, generally should result in an exception.
 *
 * @param code - The integer error code.
 * @param data - Usually an object of information to include.
 *
 * @public
 */
export function error(code: number, data: any = {}): never {
  throw Error(errorHandler.dispatch({ code, data }).message)
}
