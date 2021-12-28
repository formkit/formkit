<template>
  <FormKit
    v-model="value"
    :type="currency"
    currency="Euros"
    label="Hello world!"
    help="This is my custom help text"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { createInput } from '@formkit/vue'
import CurrencyInput from './CurrencyInput.vue'

const value = ref(13.44)
const currency = createInput(CurrencyInput, {
  props: ['currency']
})
</script>
