<script setup>
import { ref } from 'vue'
import { createFloatingLabelsPlugin } from '@formkit/addons'
import '@formkit/addons/css/floatingLabels.css'
</script>

<template>
  <div class="max-w-[800px] p-10">
    <FormKit
      :plugins="[createFloatingLabelsPlugin()]"
      type="email"
      name="email"
      label="test"
      :floating-label="true"
    />
    <FormKit
      :plugins="[createFloatingLabelsPlugin()]"
      type="email"
      name="email"
      label="test"
      floating-label="true"
    />
    <FormKit
      :plugins="[createFloatingLabelsPlugin()]"
      type="email"
      name="email"
      label="test"
      floating-label
    />
    <FormKit
      :plugins="[createFloatingLabelsPlugin()]"
      type="email"
      name="email"
      label="test"
    />
    <FormKit
      :plugins="[createFloatingLabelsPlugin({ useAsDefault: true })]"
      type="email"
      name="email"
      label="test"
      floating-label="false"
    />
    <FormKit
      :plugins="[createFloatingLabelsPlugin({ useAsDefault: true })]"
      type="email"
      name="email"
      label="test"
      :floating-label="false"
    />
  </div>
</template>
