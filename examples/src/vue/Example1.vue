<template>
  <h2>FormKit Playground</h2>
  <!-- <FormKit
    v-for="i in 50"
    :key="i"
  /> -->
  <FormKitSchema
    v-for="(itemData, index) in data"
    :key="index"
    :schema="schema"
    :data="itemData"
  />
</template>

<script setup lang="ts">
import { FormKitSchema } from '../../../packages/vue/src'
import { reactive } from 'vue'

const schema = [ // Capsule Schema Format
    {
      $el: 'label',
      children: 'What is your salary?'
    },
    {
      if: '$value >= 90000',
      then: [{ $el: 'h1', children: ['$format($value)'], attrs: { 'data-range': 'high' } }],
      else: {
        if: '$value >= 10000',
        then: [{ $el: 'h2', children: ['$format($value)'], attrs: { 'data-range': 'medium' } }],
        else: [{ $el: 'h3', children: 'You need a new job!', attrs: { 'data-range': 'low' } }],
      },
    },
    {
      $el: 'footer',
      children: [
        {
          $el: 'small',
          children: '© All rights reserved.'
        }
      ]
    }
]

const data = Array(400).fill(0).map((_, i) => reactive({
  value: 8000 + 100 * i,
  format: (value: string) => `$${value}`
}))
</script>

<style>
.container {
  max-width: 600px;
  margin: 0 auto;
}
</style>
