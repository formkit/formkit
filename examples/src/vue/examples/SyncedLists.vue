<script setup lang="ts">
import { ref } from 'vue'
import { vAutoAnimate } from '@formkit/auto-animate'
import Repeater from './Repeater.vue'

const items = []
for (let i = 0; i < 1; i++) {
  items.push({ name: Math.random(), toys: [{ name: Math.random() }] })
}
const values = ref({ users: items })
</script>

<template>
  <h1>Synced lists</h1>
  <div v-auto-animate>
    <FormKit type="form" v-model="values" #default="{ value }">
      <Repeater name="users">
        <FormKit type="text" name="name" label="Child’s name" />
      </Repeater>
    </FormKit>
  </div>
</template>
