<template>
  <h2>FormKit Playground</h2>
  <FormKit
    type="form"
    @submit="submit"
  >
    <FormKit
      type="range"
      label="Color"
      :delay="50"
      min="5"
      max="100"
      help="Pick a color"
      validation="required|min:70"
    />
    <FormKit
      label="Countries"
      type="radio"
      help="Hello help text!"
      placeholder="Select the best country"
      validation="required"
      :options="options"
    />
  </FormKit>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const options = [
  {
    label: 'Italy',
    value: 'it',
    // help: 'This is the best one'
  },
  {
    label: 'France',
    value: 'fr',
    attrs: { disabled: true },
    // help: 'This is smelliest one'
  },
  {
    label: 'Germany',
    value: 'de',
    help: 'This is the cleanest one',
  },
]
const submit = (data: Record<string, any>) => {
  console.log(data)
}
</script>

<style>
.container {
  max-width: 600px;
  margin: 0 auto;
}
</style>
