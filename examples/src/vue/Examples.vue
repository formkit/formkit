<template>
  <div>
    <h2>Vue Schema</h2>
    Enter a name
    <input
      type="text"
      :value="data.input"
      @input="setValue"
    >
    <FormKitSchema
      :schema="schema"
      :data="data"
    />
  </div>
</template>
<script lang="ts" setup>
import { reactive } from 'vue'
import schema from '../simpleSchema'
import FormKitSchema from '../../../packages/vue/src/FormKitSchema'

const data = reactive({
  input: '100'
})

const setValue = (e: Event) => {
  data.input = (e.target as HTMLInputElement).value
}
</script>
