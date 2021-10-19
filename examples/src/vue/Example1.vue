<template>
  <h2>FormKit Playground</h2>
  <FormKit
    v-slot="{ state: { valid } }"
    type="group"
  >
    <FormKit
      name="items"
      type="list"
    >
      <FormKit
        v-for="x in 1"
        :key="x"
        type="group"
      >
        <FormKit
          type="text"
          name="foo"
          :validation="[['required'], ['matches', /^foo_\d+$/]]"
          validation-behavior="dirty"
          :data-foo="foo"
          label="Foobar"
          :delay="0"
        />
        <FormKit
          type="text"
          name="bar"
          :validation="[['required'], ['matches', /^foo_\d+$/]]"
          validation-behavior="live"
          :delay="0"
        />
        <FormKit
          type="text"
          name="baz"
          validation="required|length:5"
          :delay="0"
        />
      </FormKit>
    </FormKit>
  </FormKit>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const foo = ref('foobar-1')
let i = 1;

setInterval(() => {
  foo.value = `foobar-${++i}`
}, 500)

// const longrun = (node) => {
//   return new Promise((resolve) => setTimeout(() => {
//     if (node.value === 'lets get lunch') {
//       resolve(true)
//     } else {
//       resolve(false)
//     }
//   }, 1000))
// }
</script>

<style>
.container {
  max-width: 600px;
  margin: 0 auto;
}
</style>
