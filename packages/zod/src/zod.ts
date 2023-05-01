import { FormKitNode, FormKitPlugin } from '@formkit/core'
import { ZodSchema, ZodError } from 'zod'
// import { undefine } from '@formkit/utils'

/**
 * The options to be passed to {@link createZodPlugin | createZodPlugin}
 *
 * @public
 */
export interface zodOptions {
  schema?: string
}

/**
 * Creates a new Zod schema plugin.
 *
 * @param zodOptions - The options of {@link zodOptions | zodOptions} to pass to the plugin
 *
 * @returns A {@link @formkit/core#FormKitPlugin | FormKitPlugin}
 *
 * @public
 */
export function createZodPlugin(): FormKitPlugin {
  const zodPlugin = (node: FormKitNode) => {
    // if our internal FormKit input type is not 'group' then return
    if (node.type !== 'group') return
    node.addProps(['zodSchema'])
    let zodSchema: ZodSchema<any>

    node.on('created', () => {
      zodSchema = node.props.zodSchema as ZodSchema<any>
    })

    node.hook.submit((payload, next) => {
      let errors: ZodError | undefined = undefined
      try {
        const zodValidation = zodSchema.parse(payload)
        console.log(zodValidation)
      } catch (error) {
        errors = error as ZodError
      }
      console.log(errors)
      return next(payload)
    })
  }
  return zodPlugin
}
