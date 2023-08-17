<template>
  <FormKit type="form" :actions="false">
    <FormKit type="multi-step" tab-style="tab">
      <template #badge> </template>
      <template #steps> </template>
      <FormKit type="step" name="personalInfo">
        <!-- component for example brevity. -->
        <StepOne />
      </FormKit>

      <template #step> </template>

      <FormKit type="step" name="Supplemental">
        <!-- component for example brevity. -->
        <StepThree />

        <!-- using step slot for submit button-->
        <template #stepNext="{ handlers }">
          <FormKit type="submit" @click="handlers.incrementStep" />
        </template>
      </FormKit>
    </FormKit>
  </FormKit>
</template>
