<script setup lang="ts">
import type { FormKitSchemaNode } from '@formkit/core'
import TestGroup from './components/TestGroup'

const fields: FormKitSchemaNode[] = []
for (let i = 0; i < 100; i++) {
  fields.push({
    $formkit: 'text',
    name: `testing_example_${i}`,
    label: `Testing Example ${i}`,
    key: `testing_example_${i}`,
    validation: 'required',
  })
}
</script>

<template>
  <router-link to="/e2e/memory-unmount/blank"> Blank page </router-link>
  <TestGroup>
    <form>
      <input v-for="field in fields" :key="field.name" :name="field.name" />
    </form>
  </TestGroup>
</template>
