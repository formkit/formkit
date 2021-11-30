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
      type="date"
      label="Departure date"
      help="Select a date next summer"
      :validation="[
        ['required'],
        ['date_between', summerStart, summerEnd]
      ]"
      validation-behavior="live"
    />
    <FormKit
      label="Countries"
      type="radio"
      help="Hello help text!"
      placeholder="Select the best country"
      :options="options"
    />
  </FormKit>

  <FormKit
    type="button"
    @click.prevent="() => disabled = !disabled"
  >
    {{ disabled ? 'enable' : 'un disable' }}
  </FormKit>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const disabled = ref(true)

const date = new Date()
const month = date.getMonth() + 1
const day = date.getDate()
const year = date.getFullYear()
const addYear = month > 6 ? 1 : (month === 6 ? (day > 21 ? 1 : 0) : 0)
const summerStart = new Date(`${year + addYear}-6-21`)
const summerEnd = new Date(`${year + addYear}-9-22`)

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
