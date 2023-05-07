<script setup lang="ts">
import { ref } from 'vue'
const value = ref(['one', 'two', 'three'])
</script>

<template>
  <h1>Synced lists</h1>
  <FormKit type="list" :sync="true" v-model="value" v-slot="{ items, value }">
    {{ value }}
    <div v-for="(item, index) in items" :key="item">
      <FormKit :index="index" type="text" />
      <button type="button" @click="value.splice(index + 1, 0, '')">
        Add +
      </button>
      <button type="button" @click="value.splice(index, 1)">Remove +</button>
    </div>
  </FormKit>
</template>
