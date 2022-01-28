<template>
  <FormKit
    v-model="formValues"
    type="form"
  >
    <FormKit
      type="text"
      name="first"
      label="First name"
      validation="required"
    />
    <FormKit
      type="checkbox"
      name="fruit"
      :options="[
        'Apple',
        'Strawberry',
        'Banana',
        'Grape'
      ]"
    />
    <FormKit
      type="list"
      name="emails"
      label="Emails"
      validation="required|min:2"
    >
      <FormKit
        v-for="index in emailCount"
        :key="index"
        type="email"
        :label="`Email ${index}`"
        validation="email"
      />
      <button type="button" @click="emailCount++">
        + Add email
      </button>
    </FormKit>
  </FormKit>
  <pre>{{ formValues }}</pre>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
const formValues = ref({
  fruit: ['Strawberry', 'Banana']
})
const emailCount = ref(1)
</script>
