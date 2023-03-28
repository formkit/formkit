<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router';
const show = ref(false)
const wrapper = ref<HTMLElement>()

const collectedCount = ref(0)
const observedCount = ref(0)

const registry = new FinalizationRegistry(() => {
  collectedCount.value++
})

const route = useRoute()
const type = (route.query.type ?? 'text') as string

const elements = new WeakSet<HTMLElement>()

const observer = new MutationObserver((mutationList) => {
  for (const mutation of mutationList) {
    mutation.addedNodes.forEach((node) => {
      if (!(node instanceof Element)) {
        return
      }
      const input = (node as Element).querySelector(type === 'select' ? 'select' : 'input')
      if (input instanceof HTMLInputElement || input instanceof HTMLSelectElement) {
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


const options = {
  label: 'Memory test',
  help: 'This is some help text',
  type,
  options: route.query.options ? JSON.parse(route.query.options as string) : undefined,
  validation: "required",
}
onMounted(() => {
  if (wrapper.value) {
    observer.observe(wrapper.value, { childList: true, subtree: true })
  }
  setTimeout(() => show.value = true, 200)
  setTimeout(async () => {
    show.value = false
    setTimeout(() => {
      if (typeof gc === 'function') gc()
    }, 6000)
  }, 1000)
})
</script>

<template>
  <div ref="wrapper">
    <pre data-testid="collectionData">{{ collectedCount }}/{{ observedCount }}</pre>
    <FormKit
      v-if="show"
      v-bind="options"
    />
  </div>
</template>
