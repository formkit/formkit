<template>
  <div>
    <h2>Vue Schema (Composition API)</h2>
    <input
      :value="data.value"
      @input="setValue"
    >
    <input
      @input="setQuantity"
      :value="data.quantity"
      type="number"
    >
    <FormKitSchema
      :schema="schema"
      :data="data"
    />
  </div>
</template>
<script lang="ts" setup>
import { reactive } from 'vue'
import schema from '../exampleSchema'
import { FormKitSchema } from '../../../packages/vue/src/FormKitSchema'

const data = reactive({
  value: 'Hello world',
  quantity: '5'
})

const setValue = (event: Event) => {
  data.value = (event.target as HTMLInputElement).value
}
const setQuantity = (event) => {
  data.quantity = (event.target as HTMLInputElement).value
}
</script>
