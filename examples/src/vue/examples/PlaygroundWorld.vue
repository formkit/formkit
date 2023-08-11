<script setup lang="ts">
// ESM imports are supported from URLs (https://cdn...)
// as well as secondary playground files (./OtherFile.vue).

async function submit() {
  console.log('submit')
  await new Promise((resolve) => setTimeout(resolve, 3000))
}

async function log() {
  console.log('click')
}
</script>

<template>
  <div data-loading="true">
    <FormKit type="form" @submit="submit">
      <FormKit
        type="text"
        label="FormKit Input"
        help="edit me to get started"
      />
      <FormKit type="submit" label="Submit" @click="log" />
      <FormKit type="submit" label="Submit" disabled @click="log" />
    </FormKit>
  </div>
</template>

<style scoped>
/*
vanilla CSS can go here.
Keep styles scoped to avoid multiple files
overwriting each other in the render output.
*/
</style>
