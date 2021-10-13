import { FormKitExtendableSchemaRoot } from '@formkit/schema'
import fragment from '../composables/fragment'

const listSchema: FormKitExtendableSchemaRoot = (extensions = {}) => {
  return [fragment(extensions.wrapper, '$slots.default')]
}

export default listSchema
