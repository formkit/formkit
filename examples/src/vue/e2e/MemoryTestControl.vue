<script setup lang="ts">
import TestInput from './components/TestInput.vue'
import { ref, onMounted } from 'vue'
const show = ref(false)
const wrapper = ref<HTMLElement>()

const collectedCount = ref(0)
const observedCount = ref(0)

const registry = new FinalizationRegistry(() => {
  collectedCount.value++
})

const elements = new WeakSet<HTMLElement>()

const observer = new MutationObserver((mutationList) => {
  for (const mutation of mutationList) {
    mutation.addedNodes.forEach((node) => {
      if (!(node instanceof Element)) {
        return
      }
      const input = (node as Element).querySelector('input')
      if (input instanceof HTMLInputElement) {
        if (elements.has(input)) {
          return
        }
        elements.add(input)
        registry.register(input, input.id)
        observedCount.value++
      }
    })
  }
})
onMounted(() => {
  if (wrapper.value) {
    observer.observe(wrapper.value, { childList: true, subtree: true })
  }
  setTimeout(() => (show.value = true), 200)
  setTimeout(async () => {
    show.value = false
    setTimeout(() => {
      if (typeof gc === 'function') gc()
    }, 2000)
  }, 1000)
})
</script>

<template>
  <div ref="wrapper">
    <pre data-testid="collectionData"
      >{{ collectedCount }}/{{ observedCount }}</pre
    >
    <TestInput v-if="show" id="singleTest" />
  </div>
</template>
