<template>
  <FormKitSchema
    :schema="schema"
    :data="data"
  />
</template>

<script setup lang="ts">
import { FormKitSchema } from '../../../packages/vue/src/FormKitSchema'

const schema = [{
  $cmp: 'FormKit',
  attrs: {
    min: 0,
    max: 5,
    actual: 1,
  },
  props: {
    type: 'list',
    id: 'people',
    name: "people",
    label: "People",
  },
  children: [{
    $cmp: 'FormKit',
    for: ['index', '$get(people).attrs.actual'],
    id: '$: "people."+ $index',
    props: {
      type: "group"
    },
    children: [
      {$cmp: 'FormKit', props: {type: 'text', name: 'name', label: 'Name'}},
      {$cmp: 'FormKit', props: {type: 'email', name: 'email', label: 'Email'}},
      //the delete button for this repeatable item
      {$el: 'button', children: 'Delete', attrs: { onClick: '$handleDelete'}}
    ]
  },
  // the add button for this repeatable
  {$el: 'button', children: 'Add', attrs: { onClick: '$handleAdd'}}
  ]
}]

const handleAdd = (e: Event) => {
  console.log(e)
}
const handleDelete = (e: Event) => {
  console.log(e)
}

const data = {
  handleAdd,
  handleDelete
}
</script>
