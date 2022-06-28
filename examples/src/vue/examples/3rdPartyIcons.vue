<script setup lang="ts">
import { FormKitIcon } from '@formkit/vue'

const fontAwesomeLoader = async (iconName: string) => {
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
  <h1>Custom Icons</h1>
  <h5>I use the global loader</h5>
  <div class="icon-holder">
    <FormKitIcon icon="number" />
  </div>

  <h5>I have my own loader defined</h5>
  <div class="icon-holder">
    <FormKitIcon
      icon="lightbulb"
      :icon-loader="fontAwesomeLoader"
    />
  </div>
  <FormKit
    label="I have an inline iconLoaderUrl prop"
    prefix-icon="annotation"
    :icon-loader-url="(iconName: string) => `https://cdn.jsdelivr.net/npm/heroicons/outline/${iconName}.svg`"
  />
  <FormKit
    type="form"
    :actions="false"
    :config="{
      iconLoader: fontAwesomeLoader
    }"
  >
    <FormKit
      label="FontAwesome Icons!"
      prefix-icon="bell"
      suffix-icon="ice-cream"
    />
    <h5>I inherit from my parent loader</h5>
    <div class="icon-holder">
      <FormKitIcon icon="jedi" />
    </div>
  </FormKit>
</template>

<style>
.icon-holder {
  max-width: 5em;
}
</style>
