<script setup>
import { ref } from 'vue'
const validation = ref('required')
</script>

<template>
  <h1>Hello world</h1>
  <FormKit type="text" label="Initial input" :validation="validation" />
</template>
