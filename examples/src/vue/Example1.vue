<template>
  <h2>FormKit Playground</h2>
  <!-- <FormKit
    v-model="value"
    type="checkbox"
    label="Foobar"
    help="help text"
  /> -->
  <FormKit
    v-model="values"
    label="Foo Bar!"
    type="checkbox"
    help="Hello help text!"
    placeholder="Select the best country"
    validation="required"
    :options="options"
  />
  <pre>values: {{ values }}</pre>
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
  <!--
  <FormKit
    type="checkbox"
    label="Username"
    help="Select a new username"
    v-model="value"
    :errors="['This is an error']"
  />
  <FormKit
    type="select"
    label="Select input"
    placeholder="Select one"
    :options="options"
  >
    <template #option="{ option }">
      <option :value="option.value">
        {{ option.label }} - Town
      </option>
    </template>
  </FormKit>
  <FormKit
    v-model="value"
    type="select"
    label="Select input"
    multiple
    :options="options"
  />
  <pre>{{ values }}</pre>
  <pre>{{ values2 }}</pre> -->
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
    // help: 'This is smelliest one'
  },
  {
    label: 'Germany',
    value: 'de',
    help: 'This is the cleanest one'
  },
]
// const value = ref(undefined)
const values = ref(['fr', 'de'])

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
