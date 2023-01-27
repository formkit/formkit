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
        key="firstStep"
        type="step"
        name="firstStep"
      >
        <FormKit
          type="text"
          label="Your Name"
          name="name"
          validation="required"
        />
        <FormKit
          type="email"
          label="Your email"
          name="email"
          validation="required|email"
        />
      </FormKit>

      <FormKit
        key="secondStep"
        type="step"
        name="secondStep"
      >
        <FormKit
          type="range"
          label="Your Age"
          name="age"
        />
      </FormKit>

      <FormKit
        v-if="thirdStep"
        key="thirdStep"
        name="thirdStep"
        type="step"
      >
        <template #stepNext>
          <FormKit type="submit" />
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
.fade-enter-active,
.fade-leave-active {
  transition: all 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.formkit-step-actions {
  display: flex;
  justify-content: space-between;
}
.formkit-step-actions .formkit-step-next {
  margin-left: auto;
}
</style>
