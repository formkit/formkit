<template>
  <div class="container">
    <h2>FormKit Playground</h2>
    <FormKit
      type="text"
      label="Name"
      help="Fill out your name"
      validation="required|length:10"
    />
  </div>
</template>

<script setup lang="ts">

</script>

<style>
.container {
  max-width: 600px;
  margin: 0 auto;
}
</style>
