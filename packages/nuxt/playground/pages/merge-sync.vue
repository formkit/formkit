<script lang="ts" setup>
import { useFormKitContextById } from '@formkit/vue'
const context = useFormKitContextById('myForm')
</script>

<template>
  <div>
    <pre>{{ context?.value }}</pre>
    <FormKit id="myForm" type="form" :actions="false">
      <FormKit name="username" />
      <FormKit name="username" />
    </FormKit>
  </div>
</template>
