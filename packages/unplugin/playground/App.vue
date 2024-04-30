<script setup>
// import ScriptSetupRefValidation from './ScriptSetupRefValidation.vue'
// import RefAsInputType from './RefAsInputType.vue'
</script>

<template>
  <h2>Script Setup</h2>
  <details open>
    <summary>Using script setup with a ref for validation</summary>
    <FormKit
      type="text"
      validation="required|length:10"
      label="Username"
      prefix-icon="bitcoin"
    />
    <!-- <ScriptSetupRefValidation />
    <RefAsInputType /> -->
  </details>
</template>
