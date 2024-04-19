<script lang="ts" setup>
import { ref } from 'vue'

const type = ref<'text'>('text')
</script>

<template>
  <div>
    <FormKit :type="type" />
  </div>
</template>
