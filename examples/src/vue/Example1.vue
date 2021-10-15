<template>
  <div class="container">
    <h2>FormKit Playground</h2>
    <FormKit
      v-slot="{ state: { valid } }"
      type="group"
    >
      <FormKit
        type="text"
        :validation="[['required'], ['matches', /^foo_\d+$/]]"
        validation-behavior="dirty"
        :delay="0"
      />
      <!-- <FormKit
        type="text"
        :validation="[['required'], ['matches', /^foo_\d+$/]]"
        validation-behavior="live"
        :delay="0"
      /> -->
      <!-- <FormKit
        type="text"
        validation="required|length:5"
        :delay="0"
      /> -->
      <button :disabled="!valid">isValid: {{ JSON.stringify(valid) }}</button>
    </FormKit>
  </div>
</template>

<script setup lang="ts">
// const longrun = (node) => {
//   return new Promise((resolve) => setTimeout(() => {
//     if (node.value === 'lets get lunch') {
//       resolve(true)
//     } else {
//       resolve(false)
//     }
//   }, 1000))
// }
</script>

<style>
.container {
  max-width: 600px;
  margin: 0 auto;
}
</style>
