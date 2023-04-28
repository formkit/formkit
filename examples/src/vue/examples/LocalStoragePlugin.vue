<script setup>
import { createLocalStoragePlugin } from '@formkit/addons'

const submitHandler = async function () {
  await new Promise((r) => setTimeout(r, 2000))
  alert(
    'Form submitted!, localStorage values have been cleared. Page will now reload.'
  )
  window.location.reload()
}
</script>

<template>
  <h1>Values are saved to localStorage on `commit`.</h1>
  <p>
    By default, values are saved on each `commit` hook of the parent form.
    Localstorage values are cleared on subimt.
  </p>
  <p>
    This form's `maxAge` is set to 5 seconds for preserved data. (default is 1
    hour)
  </p>

  <FormKit
    v-slot="{ value }"
    type="form"
    :plugins="[createLocalStoragePlugin({ prefix: 'myPrefix', maxAge: 5000 })]"
    name="contactForm"
    use-local-storage
    @submit="submitHandler"
  >
    <FormKit type="text" label="Your name" />
    <FormKit type="email" label="Your email" />
    <FormKit type="textarea" label="Your message" />

    <pre>{{ value }}</pre>
  </FormKit>
</template>
