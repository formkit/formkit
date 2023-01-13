<script setup>
import { ref } from 'vue'
import { FormKitIcon } from '@formkit/vue'

const icons = ['happy', 'sad', 'heart']
const icon = ref(icons[0])

const svg = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" /></svg>'
const fontAwesomeLoader = (iconName) => {
  return fetch(`https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free/svgs/solid/${iconName}.svg`)
    .then(async (r) => {
      const icon = await r.text()
      if (icon.startsWith('<svg')) {
        return icon
      }
      return undefined
    })
    .catch(e => console.error(e))
}


</script>

<template>
  <h3>Input and FormKitIcon w/ reactivity</h3>
  <FormKit
    type="text"
    label="FormKit Input"
    :prefix-icon="icon"
  />
  <FormKitIcon :icon="icon" />
  <select v-model="icon">
    <option
      v-for="iconName in icons"
      :key="iconName"
      :value="iconName"
    >
      {{ iconName }}
    </option>
  </select>
  <h3>Remote icon from FormKit CDN</h3>
  <FormKitIcon icon="ethereum" />
  <h3>Inline SVG</h3>
  <FormKitIcon :icon="svg" />
  <h3>custom loaderUrl</h3>
  <FormKitIcon
    :icon-loader-url="(iconName) => `https://cdn.jsdelivr.net/npm/heroicons/outline/${iconName}.svg`"
    icon="archive"
  />
  <h3>custom loader</h3>
  <FormKitIcon
    :icon-loader="fontAwesomeLoader"
    icon="lightbulb"
  />
</template>

<style>
.formkit-icon {
  display: block;
  max-width: 5em;
}
</style>
