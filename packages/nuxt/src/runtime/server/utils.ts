import { createError, defineEventHandler, readBody } from 'h3'
import type { H3Event, EventHandler } from 'h3'

export async function validateFormkitData(
  event: H3Event,
  route: string,
  id: string,
  data: unknown
) {
  event.context.formkit = { _data: data || {}, _id: id }
  await event.$fetch(route).catch(() => null)
  return !!event.context.formkit._validated
}

export function defineFormkitEventHandler<H extends EventHandler<any, any>>(
  handler: H,
  ids: string | string[] = []
) {
  ids = Array.isArray(ids) ? ids : [ids]

  return defineEventHandler(async (event) => {
    const { id, route, data } = await readBody(event)
    if (!ids.includes(id)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid form ID for endpoint',
      })
    }
    const validated = await validateFormkitData(event, route, id, data)
    if (!validated) {
      throw createError({
        statusCode: 422,
        message: 'Form validation failed',
        data: {
          childErrors: event.context.formkit?._validationMessages,
        },
      })
    }
    return handler(event)
  }) as H
}

declare module 'h3' {
  interface H3EventContext {
    /**
     * Internal Formkit state for handling server-side form validation.
     */
    formkit?: {
      _id?: string
      _data?: unknown
      _validated?: boolean
      _validationMessages?: Record<
        string,
        Array<string | number | boolean | undefined>
      >
    }
  }
}
