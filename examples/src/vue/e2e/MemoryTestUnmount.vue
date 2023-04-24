<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import { RouterView } from 'vue-router'

const memory = ref(0)
const id = setInterval(async () => {
  if (typeof gc === 'function') {
    gc()
  }
  memory.value = `${Math.round(
    performance.memory.usedJSHeapSize / 1000 / 1000
  )}`
}, 500)
onUnmounted(() => {
  clearInterval(id)
})
</script>

<template>
  <p>Testing</p>
  <input id="currentMemory" type="text" :value="memory" />
  <RouterView />
</template>
