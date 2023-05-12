<template>
  <h2>Register</h2>
  <FormKit
    v-model="values"
    type="form"
  >
    <FormKit
      label="Meat"
      type="text"
      name="meats"
      validation="require_one:veggies"
      validation-visibility="live"
    />
    <FormKit
      label="Veggies"
      type="checkbox"
      name="veggies"
      validation="require_one:meats"
      validation-visibility="live"
      :options="[{label: 'Mushroom', value: 3}, {label: 'Onion', value: 4}]"
    />
  </FormKit>
  <pre>{{ values }}</pre>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const values = ref({})
</script>