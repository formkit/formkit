<template>
  <h1>Basic Form</h1>
  <FormKit
    v-model="data"
    type="form"
    @submit="submitHandler"
  >
    <FormKit
      type="email"
      name="email"
      label="Email address"
      placeholder="jon@foo.com"
      validation="required|email|length:16,9"
      validation-visibility="live"
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
    <FormKit
      type="range"
      label="Age"
      :delay="50"
      min="5"
      name="age"
      max="100"
      value="20"
      help="Pick an age"
      validation="between:50,10"
    />
    <FormKit
      type="date"
      label="Departure date"
      help="Select a date next summer"
      :validation="[
        ['required'],
        ['date_between', summerStart, summerEnd]
      ]"
      validation-visibility="live"
    />
    <FormKit
      label="Countries"
      type="radio"
      help="Hello help text!"
      placeholder="Select the best country"
      :options="countries"
    />
  </FormKit>
  <pre>{{ data }}</pre>
</template>

<script setup lang="ts">
import { FormKitGroupValue } from '@formkit/core'
import { ref } from 'vue'
const data = ref({})

const date = new Date()
const month = date.getMonth() + 1
const day = date.getDate()
const year = date.getFullYear()
const addYear = month > 6 ? 1 : (month === 6 ? (day > 21 ? 1 : 0) : 0)
const summerStart = new Date(`${year + addYear}-6-21`)
const summerEnd = new Date(`${year + addYear}-9-22`)

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

const submitHandler = async function (data: FormKitGroupValue) {
  await new Promise(r => setTimeout(r, 500))
  console.log(data)
}
</script>

