<template>
  <div>
    <h2>Vue Schema (Options API)</h2>
    <!-- <input
      type="text"
      :value="data.input"
      @input="setValue"
    > -->

    <FormKitSchema
      :schema="schema"
      :data="data"
    />
  </div>
</template>
<script lang="ts">
import { FormKitSchema } from '../../../packages/vue/src/FormKitSchema'
import { FormKitSchemaNode } from '@formkit/schema'
import { defineComponent } from 'vue'
import schema from '../simpleSchema'

export default defineComponent({
  components: {
    FormKitSchema
  },
  data (): { k: string, data: Record<string, any>, schema: FormKitSchemaNode[] } {
    return {
      k: 'abc',
      data: {
          input: '100',
          location: { planet: null }
      },
      schema
    }
  },
  methods: {
    setLocation () {
      this.data.location.planet = 'earth'
    },
    setLocationByParent (): void {
      this.data.location = { planet: 'mars' }
    },
    setLocationByReplacement (): void {
      this.data = { location: { planet: 'venus' }}
    },
    changeSchema (): void {
      this.schema.push(
        {
          $el: 'h1',
          children: ['Replaced! Youre on', '$location.planet']
        }
      )
    }
  }
})
</script>
