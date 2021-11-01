<template>
  <h2>FormKit Playground</h2>
  <!-- <FormKit
    v-for="i in 50"
    :key="i"
  /> -->
  <FormKit
    type="number"
    label="Justin"
    :style="{ color: 'red' }"
    validation="required"
    name="justin"
  />
  <FormKit
    validation-behavior="live"
    label="Justin"
    validation="required|matches:foobar"
    :validation-messages="{
      matches: 'The value must be foobar'
    }"
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
