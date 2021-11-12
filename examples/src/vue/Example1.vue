<template>
  <h2>FormKit Playground</h2>
  <FormKit
    v-model="value"
    type="range"
    label="Color"
    :delay="50"
    help="Pick a color"
  />
  <FormKit
    v-model="value"
    label="Foo Bar!"
    type="radio"
    help="Hello help text!"
    placeholder="Select the best country"
    validation="required"
    :options="options"
  />
  <pre>values: {{ value }}</pre>
<!--
  <FormKit
    v-model="value"
    label="Foo Bar!"
    type="select"
    multiple
    help="Hello help text!"
    :options="['foo', 'bar', 'baz', 'bim']"
  />
  <pre>{{ value }}</pre> -->

  <FormKit
    type="checkbox"
    label="Username"
    help="Select a new username"
    :errors="['This is an error']"
  />
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
const value = ref(undefined)
// const values = ref(['fr', 'de'])

// function handler (e: Event) {
//   const input = e.target as HTMLInputElement
//   const value = input.value
//   const refValue = ['bim', 'bam', 'boom'].includes(value) ? values2 : values
//   if (input.checked && !refValue.value.includes(value)) {
//     refValue.value = value
//   } else {
//     // values.value = values.value.filter(v => v !== value)
//   }
// }
</script>

<style>
.container {
  max-width: 600px;
  margin: 0 auto;
}
</style>
