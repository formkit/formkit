<script setup>
// import ScriptSetupRefValidation from './ScriptSetupRefValidation.vue'
// import RefAsInputType from './RefAsInputType.vue'
</script>

<template>
  <h2>Script Setup</h2>
  {{ removeAll }}
  <details open>
    <summary>Using script setup with a ref for validation</summary>
    <FormKit validation="required|length:10" label="Username" />
    <!-- <ScriptSetupRefValidation />
    <RefAsInputType /> -->
  </details>
</template>
