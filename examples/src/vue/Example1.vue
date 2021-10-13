<template>
  <div class="container">
    <h2>FormKit Playground</h2>
    <FormKit
      v-slot="{ state }"
      name="group"
      type="group"
    >
      {{ state }}
      <FormKit
        type="text"
        label="Name"
        help="Fill out your name"
        value="lets get lunch"
        validation="required|length:10|longrun"
        :validation-rules="{
          longrun
        }"
        :schema="{
          help: { children: '$fns.json($state)' }
        }"
      />
    </FormKit>
  </div>
</template>

<script setup lang="ts">
const longrun = (node) => {
  return new Promise((resolve) => setTimeout(() => {
    if (node.value === 'lets get lunch') {
      resolve(true)
    } else {
      resolve(false)
    }
  }, 1000))
}
</script>

<style>
.container {
  max-width: 600px;
  margin: 0 auto;
}
</style>
