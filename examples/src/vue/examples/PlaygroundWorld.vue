<script setup lang="ts">
import { FormKitNode } from '@formkit/core'
// ESM imports are supported from URLs (https://cdn...)
// as well as secondary playground files (./OtherFile.vue).

async function submit (data: unknown, node: FormKitNode) {
    await new Promise((r) => setTimeout(r, 5))
    node.reset(data)
  }
</script>

<template>
  <FormKit
    type="form"
    :value="{ users: ['Foobar', 'Biz baz'] }"
    @submit="submit"
  >
    <FormKit
    v-slot="{ items, id }"
    type="list"
    name="users"
    dynamic
    >
      {{ id }}
      <FormKit
        v-for="(item, index) in items"
        :key="item"
        :index="index"
        type="text"
        name="name"
      />
    </FormKit>
  </FormKit>
</template>

<style scoped>
/*
vanilla CSS can go here.
Keep styles scoped to avoid multiple files
overwriting each other in the render output.
*/
</style>
