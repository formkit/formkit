<script lang="ts" setup>
const schema = [
  {
    $formkit: 'text',
    validation: 'required|min:5',
  },
]
</script>

<template>
  <div>
    <FormKitSchema :schema="schema" />
  </div>
</template>
