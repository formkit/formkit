<template>
  <div class="container">
    <h1>Examples1.vue</h1>
    <Example1 />

    <!-- <h1>TextClassifications.vue</h1>
    <TextClassifications /> -->
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Example1 from './Example1.vue'
// import TextClassifications from './TextClassifications.vue'

export default defineComponent({
  components: {
    Example1,
    // TextClassifications
  }
})
</script>

<style>
.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 4em 0;
}

h1 {
  margin-top: 2em;
  margin-bottom: 1em;
  text-align: center;
  color: rgb(68, 68, 170)
}

h1:first-child {
  margin-top: 1em;
}

</style>

