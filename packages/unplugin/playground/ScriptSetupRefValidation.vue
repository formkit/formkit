<script setup></script>

<template>
  <h1>Hello world</h1>
  <FormKit
    type="checkbox"
    :options="['Italy', 'France', 'Germany']"
    label="Initial input"
    validation="required|min:2"
  />
</template>
