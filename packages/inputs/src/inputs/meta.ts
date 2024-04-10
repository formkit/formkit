import type { FormKitTypeDefinition } from '@formkit/core'
import { fragment } from '../compose'

/**
 * Input definition for a meta input.
 * @public
 */
export const meta: FormKitTypeDefinition = {
  /**
   * The actual schema of the input, or a function that returns the schema.
   */
  schema: fragment(),
  /**
   * The type of node, can be a list, group, or input.
   */
  type: 'input',
  /**
   * An array of extra props to accept for this input.
   */
  props: [],
  /**
   * Additional features that should be added to your input
   */
  features: [],
}
