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
    action: {
      type: String,
      required: true
    }
  },
  data () {
    return {
      content: {
        price: 13.99,
        quantity: 1
      }
    }
  },
  render () {
    return h('button', {
      onClick: () => this.content.quantity++
    }, [
      this.$props.action,
      this.content.quantity,
      ' for ',
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
      action: 'Purchase '
    },
    children: '$price * $quantity'
  }
]
</script>

<style>
.container {
  max-width: 600px;
  margin: 0 auto;
}
</style>
