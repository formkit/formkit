<template>
  <div class="container">
    <h2>FormKit Playground</h2>
    <FormKitSchema
      :schema="schema"
      :library="library"
    />
  </div>
</template>

<script setup lang="ts">
import { markRaw, defineComponent, h } from 'vue'
import { FormKitSchema } from '../../../packages/vue/src/FormKitSchema'
import { FormKitSchemaNode } from '@formkit/schema'

const MyComponent = defineComponent({
  name: 'MyComponent',
  props: {
    greeting: {
      type: String,
      required: true
    }
  },
  data () {
    return {
      content: {
        location: 'world'
      }
    }
  },
  render () {
    return h('div', null, [
      this.$props.greeting,
      this.$slots.default ? this.$slots.default(this.content) : null
    ])
  }
})

const library = markRaw({
  MyComponent
})

const schema: FormKitSchemaNode[] = [
  {
    $cmp: 'MyComponent',
    props: {
      greeting: 'Hello'
    },
    children: '$location'
  }
]
</script>

<style>
.container {
  max-width: 600px;
  margin: 0 auto;
}
</style>
