<template>
  <FormKit
    v-model="value"
    :type="currencyInput"
    currency="Euros"
    label="Hello world!"
    help="This is my custom help text"
  />
  value: {{ value }}
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { createInput } from '@formkit/vue'
import CurrencyInput from './CurrencyInput.vue'

const value = ref<number>()
const currencyInput = createInput<number>(CurrencyInput, {
  props: ['currency'],
})
</script>
