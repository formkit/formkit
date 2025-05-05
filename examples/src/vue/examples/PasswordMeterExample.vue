<template>
  <div class="password-meter-example">
    <h2>Password Meter Example</h2>
    <FormKit
      type="form"
      @submit="handleSubmit"
      #default="{ value }"
    >
      <FormKit
        type="password"
        name="password"
        label="Password"
        placeholder="Enter a password"
        help="Try different passwords to see the strength meter"
        validation="required"
        :passwordMeter="true"
      />
      <pre v-if="debug">{{ value }}</pre>
    </FormKit>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const debug = ref(false)

function handleSubmit(data: any) {
  console.log(data)
}

</script>

<style>
/* Import the password meter styles */
@import '@formkit/addons/css/passwordMeterPlugin.css';

/* Additional custom styling */
.password-meter-example {
  max-width: 500px;
  margin: 0 auto;
  padding-bottom: 5em; /* Add padding to ensure popup is visible */
}

/* Remove custom styling for .formkit-input */
/*
.formkit-input {
  width: 100%;
  padding: 0.5em;
  border: 1px solid #ddd;
  border-radius: 4px;
}
*/

.formkit-wrapper {
  position: relative !important; /* Ensure wrapper is positioned for absolute children */
  margin-bottom: 1.5em;
}

/* Remove - not needed if meter is in wrapper */
/*
.formkit-input-wrapper {
  position: relative !important;
}
*/

/* Force visibility - uncomment for debugging */
/*
.formkit-password-meter {
  display: block !important;
  position: absolute !important;
  top: 100% !important;
  left: 0 !important;
  z-index: 1000 !important;
}
*/
</style>
