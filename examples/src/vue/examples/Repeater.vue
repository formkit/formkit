<script setup lang="ts">
import type { FormKitNode } from '@formkit/core'

defineProps({
  name: {
    type: String,
    required: true,
  },
})

function up(node: FormKitNode, index: number) {
  const value = node.value as any[]
  value.splice(index - 1, 0, value.splice(index, 1)[0])
  node.input(value, false)
}

function down(node: FormKitNode, index: number) {
  const value = node.value as any[]
  value.splice(index + 1, 0, value.splice(index, 1)[0])
  node.input(value, false)
}

function add(node: FormKitNode, index: number) {
  const value = node.value as any[]
  value.splice(index + 1, 0, {})
  node.input(value, false)
}

function remove(node: FormKitNode, index: number) {
  const value = node.value as any[]
  value.splice(index, 1)
  node.input(value, false)
}
</script>

<template>
  <FormKit
    type="list"
    :value="[{}]"
    :sync="true"
    :name="name"
    v-slot="{ items, node }"
  >
    <div class="item" v-for="(item, index) in items" :key="item">
      <FormKit :index="index" type="group">
        <slot />
      </FormKit>
      <button type="button" @click="add(node, index)">Add ➕</button>
      <button type="button" @click="remove(node, index)">Remove ➖</button>
      <button type="button" @click="up(node, index)">Up ⬆️</button>
      <button type="button" @click="down(node, index)">Down ⬇️</button>
    </div>
  </FormKit>
</template>

<style scoped>
.item {
  dislay: block;
  margin: 2em 0;
  box-shadow: 0 0 0.5em rgba(0, 0, 0, 0.8);
  padding: 1em;
  border-radius: 0.5em;
}
</style>
