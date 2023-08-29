<script setup lang="ts">
import type { FormKitNode } from '@formkit/core'

function setNode(node: FormKitNode) {
  console.log(node.next)
}
</script>
<template>
  <FormKit type="form" :actions="false" #default="{ value }">
    {{ value }}
    <FormKit type="multi-step" tab-style="tab" @node="setNode">
      <template #badge> </template>
      <template #steps> </template>
      <template #default>
        <FormKit type="step" name="personalInfo">
          <!-- component for example brevity. -->
          <StepOne />
        </FormKit>

        <FormKit type="step" name="Supplemental">
          <!-- component for example brevity. -->
          <StepThree />

          <!-- using step slot for submit button-->
          <template #stepNext="{ handlers }">
            <FormKit type="submit" @click="handlers.incrementStep(1)()" />
          </template>
        </FormKit>
      </template>
    </FormKit>
  </FormKit>
</template>
