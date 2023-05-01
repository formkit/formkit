<script setup>
import { ref } from 'vue'
import { createZodPlugin } from '@formkit/zod'
import * as z from 'zod'

const zodSchema = z.object({
  name: z.string().min(3).max(255),
  email: z.string().email(),
  message: z.string().min(10).max(1000),
})

const handleSubmit = async function () {
  await new Promise((r) => setTimeout(r, 2000))
  alert('Form submitted!')
}
</script>

<template>
  <h1>Kneel before Zod</h1>

  <h2>A simple form</h2>
  <FormKit
    type="form"
    :plugins="[createZodPlugin()]"
    :zod-schema="zodSchema"
    @submit="handleSubmit"
  >
    <FormKit type="text" name="name" label="Your name" />
    <FormKit type="email" name="email" label="Your email" />
    <FormKit type="textarea" name="message" label="Your message" />
  </FormKit>
</template>
