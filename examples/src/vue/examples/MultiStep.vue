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
        <FormKit
          type="textarea"
          name="story"
          label="Your Story"
          prev-label="Back to Age"
        />

        <!-- <FormKit
          type="multi-step"
          name="nestedMultiStep"
        >
          <FormKit
            type="step"
            name="firesNested"
          >
            <FormKit
              type="text"
              name="name"
            />
          </FormKit>

          <FormKit
            type="step"
            name="secondNested"
          >
            <FormKit
              type="range"
              name="age"
            />
          </FormKit>

          <FormKit
            v-if="thirdStep"
            name="thirdNested"
            type="step"
          >
            <FormKit
              type="textarea"
              name="story"
            />
          </FormKit>
        </FormKit> -->
      </FormKit>
    </FormKit>

    <!-- <FormKit
      type="multi-step"
      name="flattenMultiStep"
      :flatten-values="true"
    >
      <FormKit
        type="step"
        name="flattenStepOne"
      >
        <FormKit
          type="text"
          value="yo"
        />
      </FormKit>
      <FormKit
        type="step"
        name="flattenStepTwo"
      >
        <FormKit
          type="range"
          value="25"
        />
      </FormKit>
    </FormKit>

    <FormKit
      type="multi-step"
      name="incompleteAdvanceMultiStep"
      :flatten-values="true"
    >
      <FormKit
        type="step"
        name="incompleteAdvanceStepOne"
      >
        <FormKit
          type="text"
          value="yo"
        />
      </FormKit>
      <FormKit
        type="step"
        name="incompleteAdvanceStepTwo"
      >
        <FormKit
          type="range"
          value="25"
        />
      </FormKit>
    </FormKit> -->
  </FormKit>

  <pre>
    {{ formData }}
  </pre>
</template>

<style>

</style>
