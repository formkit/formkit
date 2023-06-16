<script setup>
import { createLocalStoragePlugin } from '@formkit/addons'
import { ref } from 'vue'

const submitHandler = async function (payload, node) {
  await new Promise((r) => setTimeout(r, 2000))
  node.reset()
}
const failingSubmitHandler = async function (payload, node) {
  await new Promise((r) => setTimeout(r, 2000))
  node.setErrors(['Something went wrong'], {
    name: 'Somebody else already has that name',
    email: 'That email is dumb',
    message: 'Nobody cares what you have to say',
  })
  node.restoreCache()
}

const mockUserId = 2
const saveData = ref(true)

async function beforeSave(payload) {
  await new Promise((r) => setTimeout(r, 1000))
  const encoded = btoa(JSON.stringify(payload))
  return encoded
}
async function beforeLoad(payload) {
  const decoded = JSON.parse(atob(payload))
  await new Promise((r) => setTimeout(r, 1000))
  return decoded
}
</script>

<template>
  <h1>Values are saved to localStorage on `commit`.</h1>
  <p>
    By default, values are saved on each `commit` hook of the parent form.
    Localstorage values are cleared on subimt.
  </p>
  <p>
    This form's `maxAge` is set to 15 seconds for preserved data. (default is 1
    hour)
  </p>
  <FormKit
    v-slot="{ value }"
    type="form"
    :plugins="[
      createLocalStoragePlugin({
        prefix: 'myPrefix',
        maxAge: 15000,
        control: 'saveData',
        beforeSave: beforeSave,
        beforeLoad: beforeLoad,
      }),
    ]"
    name="contactForm"
    use-local-storage
    @submit="submitHandler"
  >
    <FormKit
      type="checkbox"
      name="saveData"
      :value="true"
      label="Save my progress as I type"
    />
    <FormKit type="text" name="name" label="Your name" />
    <FormKit type="text" name="email" label="Your email" />
    <FormKit type="textarea" name="message" label="Your message" />

    <pre>{{ value }}</pre>
  </FormKit>

  <h1>Test on a non-form 'group' input</h1>
  <FormKit
    type="group"
    :plugins="[createLocalStoragePlugin()]"
    use-local-storage
  >
    <FormKit type="text" label="Subject" />
    <FormKit type="textarea" label="Message" />
  </FormKit>

  <h1>Test restoring cache on failed submit</h1>
  <FormKit
    v-slot="{ value }"
    type="form"
    :plugins="[createLocalStoragePlugin()]"
    name="restoreForm"
    use-local-storage
    @submit="failingSubmitHandler"
  >
    <FormKit type="text" name="name" label="Your name" />
    <FormKit type="text" name="email" label="Your email" />
    <FormKit type="textarea" name="message" label="Your message" />
    <pre>{{ value }}</pre>
  </FormKit>
</template>
