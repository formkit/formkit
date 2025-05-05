<template>
  <div class="password-meter-example">
    <h2>Password Meter Example</h2>

    <h3>Default Meter</h3>
    <FormKit
      type="form"
      :actions="false"
    >
      <FormKit
        type="password"
        name="password_default"
        label="Password (Default)"
        placeholder="Enter a password"
        help="Default strength meter appears on focus."
        validation="required"
        :passwordMeter="true"
      />

    </FormKit>

    <hr />

    <h3>Custom Labels</h3>
    <FormKit
      type="form"
      :actions="false"
    >
      <FormKit
        type="password"
        name="password_custom"
        label="Password (Custom Labels)"
        placeholder="Enter another password"
        help="Meter with custom labels for strength levels."
        validation="required"
        :passwordMeter="{
          weakLabel: 'Too weak!',
          mediumLabel: 'Getting better...',
          strongLabel: 'Very strong!'
        }"
      />
    </FormKit>

    <hr />

    <h3>Custom Regex</h3>
    <FormKit
      type="form"
      :actions="false"
    >
      <FormKit
        type="password"
        name="password_regex"
        label="Password (Custom Regex)"
        placeholder="Enter one more password"
        help="Requires 6+ chars for medium, 10+ chars & number for strong."
        validation="required"
        :passwordMeter="{
          mediumRegex: '^.{6,}$',
          strongRegex: '^(?=.*[0-9]).{10,}$'
        }"
      />

    </FormKit>

  </div>
</template>

<style>
/* Import the password meter styles */
@import '@formkit/addons/css/passwordMeterPlugin.css';

/* Additional custom styling */
.password-meter-example {
  max-width: 500px;
  margin: 0 auto;
  padding-bottom: 5em; /* Add padding to ensure popup is visible */
}


.formkit-wrapper {
  position: relative !important; /* Ensure wrapper is positioned for absolute children */
  margin-bottom: 1.5em;
}


</style>
