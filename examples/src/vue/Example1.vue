<template>
  <div>
    <h2>Vue Schema (Composition API)</h2>
    <!-- <input
      type="text"
      :value="data.input"
      @input="setValue"
    > -->
    <button @click="setLocation">
      Go to mars
    </button>
    <FormKitSchema
      :schema="schema"
      :data="data"
    />
  </div>
</template>
<script lang="ts" setup>
import { reactive } from 'vue'
import schema from '../simpleSchema'
import { FormKitSchema } from '../../../packages/vue/src/FormKitSchema'

const data = reactive({
  input: '100',
  location: { planet: 'earth' }
})

const setLocation = () => {
  data.location.planet = 'mars'
}
</script>
