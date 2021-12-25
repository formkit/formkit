<template>
  <h2>FormKit Playground</h2>
  <button @click="changeLocale">
    Change to {{ locale }}
  </button>
  <FormKit
    type="form"
    v-model="data"
    :input-errors="{
      'find(20)': ['This is a bad one'],
      fruit: 'Gross'
    }"
  >
    <!-- <FormKit
      type="group"
      name="foo"
    >
      <FormKit
        type="email"
        name="email"
        label="Email address"
        placeholder="jon@foo.com"
        validation="required|email"
        validation-behavior="live"
      />
      <FormKit
        type="file"
        label="Upload a headshot"
      />
      <FormKit
        id="fruit"
        name="fruit"
        type="select"
        label="Favorite pie"
        :options="{
          apple: 'Apple pie',
          pumpkin: 'Pumpkin pie',
          peach: 'Peach cobbler'
        }"
      />
    </FormKit>
    <FormKit
      type="range"
      label="Age"
      :delay="50"
      min="5"
      name="age"
      max="100"
      value="20"
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
      :options="countries"
    /> -->
  </FormKit>
  <pre>{{ data }}</pre>
</template>

<script setup lang="ts">
import { ref, inject } from 'vue'
import { FormKitConfig } from '../../../packages/core/src/index'
import { configSymbol } from '../../../packages/vue/src/index'
const disabled = ref(true)
const data = ref({})

const date = new Date()
const month = date.getMonth() + 1
const day = date.getDate()
const year = date.getFullYear()
const addYear = month > 6 ? 1 : (month === 6 ? (day > 21 ? 1 : 0) : 0)
const summerStart = new Date(`${year + addYear}-6-21`)
const summerEnd = new Date(`${year + addYear}-9-22`)

let locale = ref('de')

const config: FormKitConfig | undefined = inject(configSymbol)

const changeLocale = () => {
  if (config) {
    config.locale = locale.value
  }
  if (locale.value === 'de') locale.value = 'en'
  else if (locale.value === 'en') locale.value = 'fr'
  else locale.value = 'de'
}

const countries = [
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

</script>

<style>
.container {
  max-width: 600px;
  margin: 0 auto;
}
</style>
