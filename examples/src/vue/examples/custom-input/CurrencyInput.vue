<template>
  <select :value="context.currency">
    <option>Dollars</option>
    <option>Euros</option>
    <option>Renminbi</option>
  </select>
  <input
    :value="context._value"
    :class="context.classes.input"
    v-bind="context.attrs"
    @input="context.handlers.DOMInput"
  >
</template>

<script lang="ts" setup>
import { PropType, toRef } from 'vue'
import { FormKitFrameworkContext } from '@formkit/core';

const props = defineProps({
  context: {
    type: Object as PropType<FormKitFrameworkContext>,
    required: true
  }
})

const context = toRef(props, 'context')
</script>
