<template>
  <FormKit
    type="form"
    @submit="handleSubmit"
  >
    <FormKit
      type="password"
      name="password"
      label="Password"
      help="Try different passwords to see the strength meter"
      validation="required"
      :passwordMeter="true"
    />
  </FormKit>
</template>

<script setup lang="ts">
function handleSubmit(data: any) {
  console.log(data)
}
</script>

<style>
/* Import the password meter styles */
@import '@formkit/addons/css/passwordMeterPlugin.css';

.formkit-password-meter {
  position: absolute;
  width: 100%;
  margin-top: 0.5em;
}
</style>
