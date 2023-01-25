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
    
    <FormKit
      type="multi-step"
      name="defaultMultiStep"
    >
      <FormKit
        type="step"
        name="defaultStepOne"
      >
        <FormKit
          type="text"
          name="name"
          value="yo"
        />
      </FormKit>
      <FormKit
        type="step"
        name="defaultStepTwo"
      >
        <FormKit
          type="range"
          name="age"
          value="25"
        />
      </FormKit>
      <FormKit
        v-if="thirdStep"
        type="step"
        name="defaultStepThree"
        :preserve="true"
      >
        <FormKit
          type="textarea"
          name="story"
          value="Once upon a time..."
        />
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
