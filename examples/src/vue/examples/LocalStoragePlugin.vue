<script setup>
import { createLocalStoragePlugin } from '@formkit/addons'

const submitHandler = async function () {
  await new Promise((r) => setTimeout(r, 2000))
  alert(
    'Form submitted!, localStorage values have been cleared. Page will now reload.'
  )
  window.location.reload()
}

const mockUserId = 1

async function beforeSave(payload) {
  await new Promise((r) => setTimeout(r, 1000))
  const encoded = btoa(JSON.stringify(payload))
  return encoded
}
async function beforeLoad(payload) {
  await new Promise((r) => setTimeout(r, 1000))
  const decoded = JSON.parse(atob(payload))
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
        key: mockUserId,
        prefix: 'myPrefix',
        maxAge: 15000,
        beforeSave: beforeSave,
        beforeLoad: beforeLoad,
      }),
    ]"
    name="contactForm"
    use-local-storage
    @submit="submitHandler"
  >
    <FormKit type="text" name="name" label="Your name" />
    <FormKit type="text" name="email" label="Your email" />
    <FormKit type="textarea" name="message" label="Your message" />

    <pre>{{ value }}</pre>
  </FormKit>
</template>
