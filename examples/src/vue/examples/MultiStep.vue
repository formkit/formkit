<script setup>
import { ref } from 'vue'
const formData = ref({})
const thirdStep = ref(false)
</script>

<template>
  <FormKit
    type="step"
    name="invalidStep"
  >
    <h1>I should throw a warning and not render because I am not an immediate child of a type="multi-step"</h1>
  </FormKit>

  <FormKit
    v-model="formData"
    type="form"
    :actions="false"
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
.formkit-step-actions {
  display: flex;
  justify-content: space-between;
}
.formkit-step-actions .formkit-step-next {
  margin-left: auto;
}
</style>
