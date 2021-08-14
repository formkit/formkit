<script lang="ts">
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'Examples',
  setup () {
    const type = ref('select')
    return { type }
  }
})
</script>

<template>
  <h1>Specimen</h1>
  <button @click="() => type = String(Math.random() * 10)">
    Change type
  </button>
  <FormulateInput :type="type" />
</template>
