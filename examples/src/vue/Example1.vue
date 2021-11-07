<template>
  <h2>FormKit Playground</h2>
  <FormKit
    type="text"
    label="Username"
    help="Select a new username"
    :errors="['This is an error']"
  />
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
