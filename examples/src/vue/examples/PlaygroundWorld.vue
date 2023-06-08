<script setup lang="ts">
// Nothing here yet, but it's coming soon!
</script>

<template>
  <FormKit type="number" :value="123" :foo="123" @custom="(value) => value">
    <template #default="foo">
      {{ foo }}
    </template>
  </FormKit>
</template>

<style scoped>
/*
vanilla CSS can go here.
Keep styles scoped to avoid multiple files
overwriting each other in the render output.
*/
</style>
