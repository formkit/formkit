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

interface CurrencyAmount { currency: string, amount: string }
const value = ref<CurrencyAmount>({ currency: '$', amount: '2.99' })
const currencyInput = createInput<CurrencyAmount>(CurrencyInput, { props: ['currency'] })
</script>
