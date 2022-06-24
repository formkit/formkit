<script setup lang="ts">
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
  </FormKit>
</template>
