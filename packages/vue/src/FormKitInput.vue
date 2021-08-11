<script lang="ts">
import { defineComponent, ref } from 'vue'
export default defineComponent({
  setup () {
    const name = ref('justin-schroeder')
    return {
      name
    }
  }
})
</script>

<template>
  <div>Hello world {{ name }}</div>
</template>
