<template>
  <div>
    <h2>Vue Schema</h2>
    <input
      type="text"
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
  value: ''
})

const setValue = (e: Event) => {
  data.value = (e.target as HTMLInputElement).value
}
</script>
