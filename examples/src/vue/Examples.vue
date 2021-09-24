<template>
  <Example1 />
  <!-- <hr>
  <Example2 /> -->
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Example1 from './Example1.vue'
// import Example2 from './Example2.vue'

export default defineComponent({
  components: {
    Example1,
    // Example2
  }
})
</script>
