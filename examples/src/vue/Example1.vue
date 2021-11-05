<template>
  <h2>FormKit Playground</h2>
  <!-- <FormKit
    v-for="i in 50"
    :key="i"
  /> -->
  <FormKit
    type="select"
    label="Select input"
    placeholder="Select one"
    :options="['foo', 'bar', 'baz']"
  />
</template>

<script setup lang="ts">
// import { FormKit } from '../../../packages/vue/src'


</script>

<style>
.container {
  max-width: 600px;
  margin: 0 auto;
}
</style>
