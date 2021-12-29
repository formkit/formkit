<template>
  <input
    :value="context._value"
    v-bind="context.attrs"
    @input="input"
  >
  {{ context._value }}
</template>

<script lang="ts" setup>
import { PropType, toRef } from 'vue'
import { FormKitFrameworkContext } from '@formkit/core';

const props = defineProps({
  context: {
    type: Object as PropType<FormKitFrameworkContext & { currency: string }>,
    required: true
  }
})

const context = toRef(props, 'context')

const input = (event: Event) => {
  const value = (event.target as HTMLInputElement).value
  props.context.node.input(value)
}
</script>

