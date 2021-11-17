<template>
  <h2>FormKit Playground</h2>
  <FormKit
    type="form"
    @submit="submit"
  >
    <FormKit
      type="email"
      label="Email address"
      placeholder="jon@foo.com"
    />
    <FormKit
      type="select"
      label="Favorite pie"
      placeholder="Select a favorite"
      :options="{
        apple: 'Apple pie',
        pumpkin: 'Pumpkin pie',
        peach: 'Peach cobbler'
      }"
    />
    <FormKit
      type="range"
      label="Age"
      :delay="50"
      min="5"
      max="100"
      help="Pick an age"
    />
    <FormKit
      label="Countries"
      type="radio"
      help="Hello help text!"
      placeholder="Select the best country"
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
const submit = async (data: Record<string, any>) => {
  await new Promise(r => setTimeout(r, 2000))
}
</script>

<style>
.container {
  max-width: 600px;
  margin: 0 auto;
}
</style>
