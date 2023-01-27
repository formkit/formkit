<script setup>
import { ref } from 'vue'
const formData = ref({})
const thirdStep = ref(false)
</script>

<template>
  <FormKit
    v-model="formData"
    type="form"
  >
    <FormKit
      v-model="thirdStep"
      type="checkbox"
      label="Add third step"
    />

    <FormKit type="multi-step">
      <FormKit
        type="step"
        name="firstStep"
        next-label="Continue to Age"
      >
        <FormKit
          type="text"
          label="Your Name"
          name="name"
        />
      </FormKit>

      <FormKit
        type="step"
        name="secondStep"
        prev-label="Back to Name"
        next-label="Continue to Story"
      >
        <FormKit
          type="range"
          label="Your Age"
          name="age"
        />
      </FormKit>

      <FormKit
        v-if="thirdStep"
        name="thirdStep"
        type="step"
      >
        <template #actionPrevious>
          <h1>test</h1>
        </template>

        <FormKit
          type="textarea"
          name="story"
          label="Your Story"
        />
      </FormKit>
    </FormKit>
  </FormKit>

  <pre>
    {{ formData }}
  </pre>
</template>

<style>

</style>
