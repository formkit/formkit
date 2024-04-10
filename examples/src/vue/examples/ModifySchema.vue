
<script lang="ts" setup>
import { ref } from 'vue'
import type { FormKitPlugin, FormKitExtendableSchemaRoot } from '@formkit/core'

const pluginRemoveInnerWrapper: FormKitPlugin = (inputNode) => {
  inputNode.on('created', ({ payload: node }) => {
    // Ensure we only tap into checkboxes:
    if (
      node.props?.type === 'checkbox' &&
      typeof node.props.definition.schema === 'function'
    ) {
      // Lets retain our own copy of this definition to prevent deep object referencing
      const definition = { ...node.props.definition }
      // Store the original schema
      const schema = definition.schema

      // We replace the schema with our own higher-order-function
      const newSchema: FormKitExtendableSchemaRoot = function (extensions = {}) {
        if (!extensions.inner) {
          extensions.inner = {
            attrs: {
              style: {
                backgroundColor: 'red'
              }
            }
          }
        }
        // Finally we call the original schema, with our extensions applied
        return schema(extensions)
      }
      // Now replace the schema
      definition.schema = newSchema

      // Now we replace the input definition
      node.props.definition = definition
    }
  })
}
const activateSuffix = ref(false)
setInterval(() => activateSuffix.value = !activateSuffix.value, 1000)
</script>

<template>
  <h2>Tell us a little about yourself</h2>
  <FormKit
    type="form"
    :plugins="[pluginRemoveInnerWrapper]"
  >
    <FormKit
      label="I like sports"
      type="checkbox"
    />
    <FormKit
      label="I like music"
      type="checkbox"
    />
    <FormKit
      label="Your Email"
      type="email"
    />
  </FormKit>

  <FormKit type="text" label="default">
    <template v-if="activateSuffix" #label><label class="expo-label">my label <span style="color: blue">with blue suffix</span></label></template>
  </FormKit>
  {{ activateSuffix }}
</template>

