<script setup>
// import ScriptSetupRefValidation from './ScriptSetupRefValidation.vue'
// import RefAsInputType from './RefAsInputType.vue'
function clicked() {
  alert('did click')
}
</script>

<template>
  <h2>Script Setup</h2>
  <details open>
    <summary>Using script setup with a ref for validation</summary>
    <FormKit type="form">
      <FormKit type="text" validation="required" />
      <FormKit type="checkbox" name="terms" label="I agree to the terms" />
      <FormKit type="file" />
    </FormKit>

    <!-- <ScriptSetupRefValidation />
    <RefAsInputType /> -->
  </details>
</template>
