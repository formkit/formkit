<script setup lang="ts">
import { ref } from 'vue'
function foobar(data: { a: 123 }) {
  console.log(data.a)
}
const options = ref({ a: '123', b: '546' })
</script>

<template>
  <FormKit />
  <FormKit type="form" @submit="foobar">
    <FormKit
      type="checkbox"
      :options="[
        { label: 'a', value: '123' },
        { label: 'b', value: null },
      ]"
      @input="(value, node) => value && node"
    />
    <FormKit type="text">
      <template #label="{ value }">
        {{ value }}
      </template>
    </FormKit>
    <FormKit type="select" :options="options">
      <template #default="{ value }">
        {{ value }}
      </template>
    </FormKit>
  </FormKit>
</template>

<style scoped>
/*
vanilla CSS can go here.
Keep styles scoped to avoid multiple files
overwriting each other in the render output.
*/
</style>
