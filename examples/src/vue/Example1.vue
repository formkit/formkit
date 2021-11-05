<template>
  <h2>FormKit Playground</h2>
  <!-- <FormKit
    v-for="i in 50"
    :key="i"
  /> -->
  <FormKit
    type="select"
    label="Select input"
    placeholder="Select one"
    :options="options"
  />

  <FormKit
    type="select"
    label="Select input"
    placeholder="Select one"
    multiple
    :options="options"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'

// const foo = ref('bar')
const options = ['foo', 'bar', 'baz']

// let i = 0;
// setInterval(() => {
//   foo.value = options[i++]
//   if (i >= options.length) {
//     i = 0
//   }
// }, 100)
</script>

<style>
.container {
  max-width: 600px;
  margin: 0 auto;
}
</style>
