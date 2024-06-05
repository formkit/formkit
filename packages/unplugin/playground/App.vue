<script setup>
// import ScriptSetupRefValidation from './ScriptSetupRefValidation.vue'
// import RefAsInputType from './RefAsInputType.vue'
function clicked() {
  alert('did click')
}

const fooBar = {
  $cmp: 'FormKit',
  props: {
    type: 'button',
    suffixIcon: 'arrowRight',
  },
}
</script>

<template>
  <h2>Script Setup</h2>
  <details open>
    <summary>Using script setup with a ref for validation</summary>
    <!-- <FormKit type="form">
      <FormKit type="datepicker" />
      <FormKit type="text" validation="required" />
      <FormKit type="checkbox" name="terms" label="I agree to the terms" />
      <FormKit
        type="radio"
        name="flavors"
        :options="['Apple', 'Strawberry']"
        label="Pick one flavor"
      />
      <FormKit
        type="select"
        :options="['Turtle', 'French', 'House', 'Absolute']"
      />
      <FormKit type="file" />
    </FormKit> -->

    <FormKitSchema
      :schema="[
        {
          $formkit: 'text',
          label: 'Username',
          help: 'Help me learn things',
          validation: 'required|length:5',
        },
        fooBar,
        {
          $formkit: 'select',
          options: ['A', 'B'],
          label: 'Foosball',
        },
      ]"
    />

    <!-- <ScriptSetupRefValidation />
    <RefAsInputType /> -->
  </details>
</template>
