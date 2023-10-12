<script setup lang="ts">
import { FormKitKitchenSink } from '@formkit/vue'
</script>

<template>
  <Suspense>
    <FormKitKitchenSink :pro="false" />
  </Suspense>
</template>
