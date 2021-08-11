<script lang="ts">
import { defineComponent, ref } from 'vue'
export default defineComponent({
  setup () {
    return {
      name: ref('justin-schroeder')
    }
  }
})
</script>

<template>
  <div>Hello world {{ name }}</div>
</template>
