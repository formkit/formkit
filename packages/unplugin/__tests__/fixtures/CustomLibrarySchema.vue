<script lang="ts" setup>
const schema = [
  {
    $formkit: 'text',
    name: 'foo',
  },
  {
    $formkit: 'remove',
    name: 'bar',
  },
]
</script>

<template>
  <div>
    <FormKitSchema :schema="schema" />
  </div>
</template>
