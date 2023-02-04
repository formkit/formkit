<script setup>
import { createFloatingLabelsPlugin } from '@formkit/addons'
import '@formkit/addons/css/floatingLabels.css'
</script>

<template>
  <FormKit
    type="form"
    :plugins="[createFloatingLabelsPlugin({ useAsDefault: true })]"
  >
    <FormKit
      type="text"
      label="Floating Text Label"
      :floating-label="false"
    />
    <FormKit
      type="email"
      label="Floating Email Label"
    />
    <FormKit
      type="textarea"
      label="Floating Textarea Label"
    />
  </FormKit>
</template>