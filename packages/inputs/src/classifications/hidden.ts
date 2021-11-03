import { FormKitExtendableSchemaRoot } from '@formkit/core'
import text from '../composables/text'

/**
 * The schema for text classifications.
 * @public
 */
const hiddenSchema: FormKitExtendableSchemaRoot = (extensions = {}) => [
  text(extensions.input),
]

export default hiddenSchema
