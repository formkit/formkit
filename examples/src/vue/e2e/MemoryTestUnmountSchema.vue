<script setup lang="ts">
const fields = []
for (let i = 0; i < 50; i++) {
  fields.push({
    $formkit: 'text',
    name: `testing_example_${i}`,
    label: `Testing Example ${i}`,
    key: `testing_example_${i}`,
    validation: 'required',
  })
}

const testSchema = [...fields]
</script>

<template>
  <router-link to="/e2e/memory-unmount/blank"> Blank page </router-link>
  <router-link to="/e2e/memory-unmount/control"> Control page </router-link>
  <FormKit type="form">
    <FormKitSchema :schema="testSchema" />
  </FormKit>
</template>
