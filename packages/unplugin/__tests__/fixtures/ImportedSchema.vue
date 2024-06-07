<script lang="ts" setup>
import fromAnotherFile from './schemas/login'
</script>

<template>
  <FormKitSchema :schema="fromAnotherFile" />
</template>

<style></style>
