<script setup lang="ts">
import { FormKitKitchenSink } from '@formkit/vue'
</script>

<template>
  <h2>loading a form:</h2>
  <Suspense>
    <FormKitKitchenSink :schemas="['form/login']" />
  </Suspense>
  <h2>loading inputs:</h2>
  <Suspense>
    <FormKitKitchenSink :pro="false" />
  </Suspense>
</template>
