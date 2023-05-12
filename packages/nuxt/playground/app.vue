<script lang="ts" setup>
let memoryValue
if (typeof window === 'undefined') {
  if (typeof globalThis.gc === 'function') gc()
  memoryValue = Math.round(process.memoryUsage().heapUsed / 1000 / 100) / 10
}
</script>

<template>
  <div class="my-form">
    <label>
      Server memory
      <input id="memory" :value="memoryValue">
    </label>
    <FormKit
      type="form"
      :value="{ hydration_test: 'Testing hydration', tailwind: 'lots' }"
    >
      <FormKit
        label="I've got Tailwind classes from rootClasses"
        placeholder="Look Ma! Tailwind styles."
        help="I only get the `text` styles because the config has conditional logic"
      />
      <FormKit
        label="I override my label color"
        placeholder="I don't like to conform"
        :classes="{
          label: {
            'text-gray-600': false,
            'text-red-600': true,
          },
        }"
        help="Gray label text color removed, red added."
        validation="required"
        validation-visibility="live"
        value="This is hydrated"
      />
      <FormKit id="hydration_test" type="textarea" name="hydration_test" />
      <FormKit
        label="How much do you like Tailwind?"
        type="radio"
        name="tailwind"
        :options="{
          little: 'I like it a little',
          lots: 'I like it a lot',
        }"
        help="I only get the `radio` styles because the config has conditional logic"
      />
    </FormKit>
  </div>
</template>

<style>
.my-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 1em;
}
</style>
