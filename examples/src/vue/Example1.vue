<template>
  <h2>FormKit Playground</h2>
  <FormKit
    v-slot="{ state: { valid } }"
    type="group"
  >
    IS VALID: {{ valid }}
    <FormKit
      name="items"
      type="list"
      :config="{
        plugins: [customInput]
      }"
    >
      <FormKit
        type="foobar"
      />
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
import { FormKitNode } from '@formkit/core'
const customInput = function () {
  //
}

customInput.library = (node: FormKitNode) => {
  console.log('got here!')
  if (node.props.type === 'foobar') {
    node.define({
      type: 'input',
      schema: [
        {
          $el: 'Hello world!'
        }
      ]
    })
  }
}
</script>

<style>
.container {
  max-width: 600px;
  margin: 0 auto;
}
</style>
