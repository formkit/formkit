<template>
  <div class="container">
    <h2>FormKit Playground</h2>
    <FormKit
      v-slot="{ value }"
      type="group"
    >
      {{ value }}
      <FormKit
        name="actions"
        type="list"
      >
        <FormKit
          v-for="i in 100"
          :key="i"
          name="group"
          type="group"
        >
          <FormKit
            type="text"
            label="Email address"
            name="email"
            placeholder="foo@bar.com"
            help="What is your address"
            validation="required|length:10|longrun"
            :validation-rules="{
              longrun
            }"
          />
          <FormKit
            type="text"
            label="What do you want to do?"
            name="action"
            help="Only: “lets get lunch” is a valid value"
            validation="required|length:10|longrun"
            :validation-rules="{
              longrun
            }"
          />
        </FormKit>
      </FormKit>
    </FormKit>
  </div>
</template>

<script setup lang="ts">
const longrun = (node) => {
  return new Promise((resolve) => setTimeout(() => {
    if (node.value === 'lets get lunch') {
      resolve(true)
    } else {
      resolve(false)
    }
  }, 1000))
}
</script>

<style>
.container {
  max-width: 600px;
  margin: 0 auto;
}
</style>
