<template>
  <div class="my-form">
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
          'text-red-600': true
        }
      }"
      help="Gray label text color removed, red added."
      validation="required"
      validation-visibility="live"
    />
    <FormKit
      label="How much do you like Tailwind?"
      type="radio"
      :options="{
        little: 'I like it a little',
        lots: 'I like it a lot'
      }"
      help="I only get the `radio` styles because the config has conditional logic"
    />
  </div>
</template>

<script lang="ts" setup>
</script>

<style>
.my-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 1em;
}
</style>
