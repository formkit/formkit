<template>
  <div class="container">
    <h2>FormKit Vue (Composition API)</h2>
    <FormKit
      type="group"
      name="numbers"
    >
      <FormKit
        name="pizza"
        label="Hello world!"
        validation="required|min:20"
        type="text"
      />
    </FormKit>
  </div>
</template>
<script lang="ts" setup>
</script>

<style scoped>
.container {
  margin: 0 auto;
  max-width: 600px;
}
.inputs {
  display: flex;
}
</style>
