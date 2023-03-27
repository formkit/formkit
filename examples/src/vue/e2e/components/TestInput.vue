<script setup lang="ts">
defineProps({
  id: {
    type: String,
    required: true
  }
})

</script>
<template>
  <div>
    <input
      :id="id"
      type="text"
    >
  </div>
</template>
