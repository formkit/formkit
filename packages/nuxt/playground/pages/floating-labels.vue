<script setup>
import { ref } from 'vue'
import { createFloatingLabelsPlugin } from '@formkit/addons'
import '@formkit/addons/css/floatingLabels.css'

const animate = ref(false)
</script>

<template>
  <div class="max-w-[800px] p-10">
    <button class="border-2 p-4 mb-4" @click="animate = !animate">
      Click to Transition
    </button>
    <Transition
      appear
      enter-active-class="transition-transform duration-[2s] ease-out"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform ease-out"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <div v-if="animate" class="mb-4">
        <FormKit type="form">
          <FormKit
            :plugins="[createFloatingLabelsPlugin()]"
            type="email"
            name="email"
            label="test"
            :floating-label="true"
          />
        </FormKit>
      </div>
    </Transition>
  </div>
</template>
