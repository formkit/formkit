<script lang="ts" setup>
const schema = [
  {
    $formkit: 'text',
    validation: 'required|min:5',
  },
  {
    $formkit: 'select',
    label: 'My dropdown',
    options: ['🇺🇸 America', '🇮🇹 Italy'],
  },
]
</script>

<template>
  <div>
    <FormKit type="select" :options="['A', 'B']" />
    <!-- <FormKitSchema :schema="schema" /> -->
  </div>
</template>
