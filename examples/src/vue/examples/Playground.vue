<script setup>
  import {ref} from "vue";

  const stringify = (value) => JSON.stringify(value);

  const currentValue = ref(undefined);
</script>

<template>
  <FormKit
    v-model="currentValue"
    type="radio"
    label="FormKit Input"
    :options="[
      { value: true, label: 'Yes' },
      { value: false, label: 'No' },
      { value: null, label: 'N/A' },
    ]"
  />
  <div>Value: {{stringify(currentValue)}}</div>
</template>

<style scoped>
/*
vanilla CSS can go here.
Keep styles scoped to avoid multiple files
overwriting each other in the render output.
*/
</style>
