<template>
  <h2>FormKit Playground</h2>
  <FormKit
    v-slot="{ state: { valid } }"
    type="group"
  >
    <FormKit
      name="items"
      type="list"
    >
      <FormKit
        v-for="x in 1"
        :key="x"
        type="group"
      >
        <FormKit
          type="text"
          name="foo"
          :validation="[['required'], ['matches', /^foo_\d+$/]]"
          validation-behavior="dirty"
          :data-foo="foo"
          label="Foobar"
          :delay="0"
        />
        <FormKit
          type="text"
          name="bar"
          :validation="[['required'], ['matches', /^foo_\d+$/]]"
          validation-behavior="live"
          :delay="0"
        />
        <FormKit
          type="text"
          name="baz"
          validation="required|length:5"
          :delay="0"
        />
      </FormKit>
    </FormKit>
  </FormKit>
</template>

<script setup lang="ts">
import { markRaw, defineComponent, h } from 'vue'
import { FormKitSchema } from '../../../packages/vue/src/FormKitSchema'
import { FormKitSchemaNode } from '@formkit/core'

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
    $cmp: 'FormKit',
    props: {
      label: 'Purchase price',
      id: 'purchase',
      value: '100'
    }
  },
  {
    $cmp: 'FormKit',
    props: {
      label: 'Reflection',
      modelValue: '$get(purchase).value'
    }
  }
]
</script>

<style>
.container {
  max-width: 600px;
  margin: 0 auto;
}
</style>
