<script setup lang="ts">
import { createZodPlugin } from '../../../../packages/zod/src'
import * as z from 'zod'

const zodSchema = z.object({
  personalInfo: z.object({
    firstName: z.string().min(3).max(255),
    lastName: z.string().min(3).max(255),
  }),
  email: z.string().email({
    message: 'Please enter a valid email address',
  }),
  message: z.string().min(10).max(1000),
  missing: z.number(),
})

const submitCallback = async function (formData: z.infer<typeof zodSchema>) {
  console.log(formData)
  await new Promise((r) => setTimeout(r, 2000))
}

const [zodPlugin, submitHandler] = createZodPlugin(zodSchema, submitCallback)
</script>

<template>
  <h1>Kneel before Zod</h1>

  <h2>A simple form</h2>
  <FormKit type="form" :plugins="[zodPlugin]" @submit="submitHandler">
    <FormKit type="text" name="email" label="Your email" />
    <FormKit type="textarea" name="message" label="Your message" />
    <FormKit type="group" name="personalInfo">
      <FormKit type="text" name="firstName" label="First Name" />
      <FormKit type="text" name="lastName" label="Last Name" />
    </FormKit>
  </FormKit>
</template>
