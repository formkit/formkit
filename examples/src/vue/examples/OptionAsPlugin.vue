<template>
  <h1>OptionAs Plugin</h1>
  {{ users }}
  <FormKit id="form" v-model="data" type="form" @submit="submitHandler">
    <FormKit name="normal-select" type="select" label="Normal Select" :options="normalCases" />

    <FormKit name="with-select" type="select" label="With Plugin" :options="users" />
    <FormKit name="with-select-another-label" type="select" label="With Another Label" label-as="description"
      :options="users" />

    <FormKit name="with-checkbox" type="checkbox" label="With Plugin" :options="users" />

    <FormKit name="with-radio" type="radio" label="With Plugin" :options="users" />

    <FormKit type="button" @click="addUser" label="New User" />
  </FormKit>
  <pre>{{ data }}</pre>
</template>

<script setup lang="ts">
import { setErrors } from '@formkit/vue';
import { ref } from 'vue';

const data = ref({});

const normalCases = [
  {
    value: 1,
    label: 'You can use options as normal',
  },
  {
    value: 2,
    label: 'Normal Case',
  },
];

const users = ref([
  {
    id: 1,
    name: 'Justin Schroeder',
    description: 'Smart Justin!'
  },
  {
    id: 2,
    name: 'Luan Nguyen',
    description: 'Smart Luan!'
  },
  {
    id: 3,
    name: 'Andrew Boyd',
    description: 'Smart Andrew!'
  },
  {
    id: 4,
    name: 'Chris Adams',
    description: 'Smart Chris!'
  },
  {
    id: 5,
    name: 'Chris Ellinger',
    description: 'Smart Chris!'
  },
  {
    id: 6,
    name: 'Sasha Milenkovic',
    description: 'Smart Sasha!'
  },
  {
    id: 7,
    name: 'Gustavo Fenilli',
    description: 'Not so Smart Gustavo!',
    attrs: { disabled: true }
  },
]);

const addUser = () => {
  users.value = [...users.value, { id: 8, name: 'New User', description: 'New Description' }];
};

const submitHandler = async function () {
  await new Promise(r => setTimeout(r, 2000))
  setErrors('form', ['This isn’t setup to actually do anything.'])
}
</script>
