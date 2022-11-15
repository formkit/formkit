
<script setup lang="ts">
import { setErrors } from '@formkit/vue'
import { ref } from 'vue'
const data = ref({})

const date = new Date()
const month = date.getMonth() + 1
const day = date.getDate()
const year = date.getFullYear()
const fruit = ref(null)
const addYear = month > 6 ? 1 : (month === 6 ? (day > 21 ? 1 : 0) : 0)
const summerStart = new Date(`${year + addYear}-6-21`)
const summerEnd = new Date(`${year + addYear}-9-22`)

const countries = [
  {
    label: 'Italy',
    value: 'it',
    help: 'This is the best one'
  },
  {
    label: 'France',
    value: 'fr',
    attrs: { disabled: true },
    help: 'This is smelliest one'
  },
  {
    label: 'Germany',
    value: 'de',
    help: 'This is the cleanest one',
  },
]

const submitHandler = async function (data: { email: string }) {
  await new Promise(r => setTimeout(r, 2000))
  console.log(data)
  setErrors('form', ['This isn’t setup to actually do anything.'])
}
</script>

<template>
  <h1>Basic Form</h1>
  <FormKit
    v-model="data"
    type="form"
    @submit="submitHandler"
  >
    <FormKit
      type="select"
    />
    <FormKit
      type="number"
      label="Age"
      validation="between:21,18"
      validation-visibility="live"
    />
    <FormKit
      type="email"
      name="email"
      label="Email address"
      help="What is your email address?"
      placeholder="jon@foo.com"
      validation="required|email|length:16,9"
      validation-visibility="live"
    />
    <FormKit
      type="file"
      name="file"
      label="Your file"
      no-files-icon="upload"
      placeholder="jon@foo.com"
      validation="required"
      validation-visibility="live"
      multiple="true"
    />
    <FormKit
      id="fruit"
      name="fruit"
      type="select"
      label="Favorite pie"
      placeholder="Select some pie"
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
      type="checkbox"
      name="countries"
      help="Hello help text!"
      placeholder="Select the best country"
      :options="countries"
    />
    <FormKit
      type="checkbox"
      label="Do you agree to our terms?"
      help="You need to do this"
    />
    <FormKit
      v-model="fruit"
      label="Select a fruit"
      type="radio"
      name="fruit"
      help="Hello help text!"
      placeholder="Select the best country"
      :options="['Apple', 'Strawberry', 'Banana']"
    >
      <template #help>Some help text</template>
    </FormKit>
    <FormKit
      v-if="fruit"
      type="checkbox"
      :label="`Please confirm that you meant to select ${fruit}?`"
    />

    <FormKit
      label="What's your favorite plant?"
      multiple
      type="select"
      name="planet"
      placeholder="Select the best planet"
      :options="['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']"
    />
  </FormKit>
  <pre>{{ data }}</pre>
</template>

