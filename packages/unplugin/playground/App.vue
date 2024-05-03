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
    <FormKit type="select" validation="required|length:10" />
    <!-- <ScriptSetupRefValidation />
    <RefAsInputType /> -->
  </details>
</template>
