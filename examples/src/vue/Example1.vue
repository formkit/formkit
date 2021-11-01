<template>
  <h2>FormKit Playground</h2>
  <!-- <FormKit
    v-for="i in 50"
    :key="i"
  /> -->
  <FormKit
    validation-behavior="live"
    label="Justin"
  />
</template>

<script setup lang="ts">
import { FormKitSchema } from '../../../packages/vue/src'

const schema = [
  {
    $el: 'div',
    attrs: {
      style: '$colors',
      class: '$foo.class'
    },
    children: '$slots.default'
  }
]

const data = {
  colors: { color: 'red' },
  foo: {
    class: 'bar-foo'
  }
}

</script>

<style>
.container {
  max-width: 600px;
  margin: 0 auto;
}
</style>
