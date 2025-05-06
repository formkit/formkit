<template>
  <FormKit
    v-model="value"
    :type="currencyInput"
    currency="Euros"
    label="Hello world!"
    help="This is my custom help text"
  />
  <FormKit label="foobar" value="123" />
  <FormKit type="file" :value="[]" />
  <FormKit value="123" />
  value: {{ value }}
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { createInput } from '@formkit/vue'
import CurrencyInput from './CurrencyInput.vue'

const value = ref<{ a: number }>()
const currencyInput = createInput<{ a: number }>(CurrencyInput, {
  props: ['currency'],
})
</script>
