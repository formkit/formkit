<script setup lang="ts">
import { FormKitNode } from '@formkit/core'
import { createZodPlugin } from '../../../../packages/zod/src'
import { z } from 'zod'

const zodSchema = z.object({
  personalInfo: z.object({
    firstName: z.string().min(3).max(25),
    lastName: z.string().min(3).max(25),
  }),
  email: z.string().email(),
  message: z.string().min(10).max(1000),
  url: z.string().url(),
  regex: z.string().regex(/^[a-zA-Z0-9]{3,30}$/),
  startsWith: z.string().startsWith('foo'),
  endsWith: z.string().endsWith('bar'),
  startsAndEndsWith: z.string().startsWith('foo').endsWith('bar'),
  dateBefore: z.coerce.date().max(new Date('2023-04-05')),
  dateAfter: z.coerce.date().min(new Date('1900-01-01')),
  arrayMin: z.string().array().min(2),
  arrayMax: z.string().array().max(2),
  missing: z.number(),
})

const invalidValues = {
  personalInfo: {
    firstName: 'A',
    lastName: 'K',
  },
  email: 'test@test',
  message: 'Hello',
  url: 'test',
  regex: 't',
  startsWith: 'bar',
  endsWith: 'foo',
  startsAndEndsWith: 'a',
  dateBefore: '3000-01-01',
  dateAfter: '1899-04-05',
  arrayMin: ['a'],
  arrayMax: ['a', 'b', 'c'],
  missing: 'test',
}

const zodParseResults = zodSchema.safeParse(invalidValues)
let zodErrors: z.ZodError | undefined
if (!zodParseResults.success) {
  zodErrors = zodParseResults.error
}

const [zodPlugin, submitHandler] = createZodPlugin(
  zodSchema,
  async (formData) => {
    console.log(formData)
    await new Promise((r) => setTimeout(r, 2000))
  }
)

function setupFormNode(node: FormKitNode) {
  node.setZodErrors(zodErrors)
}
</script>

<template>
  <h1>Kneel before Zod</h1>

  <h2>A simple form</h2>
  <FormKit
    type="form"
    :plugins="[zodPlugin]"
    :value="invalidValues"
    @submit="submitHandler"
    @node="setupFormNode"
  >
    <FormKit type="text" name="email" label="Your email" validation="email" />
    <FormKit type="textarea" name="message" label="Your message" />
    <FormKit type="group" name="personalInfo">
      <FormKit type="text" name="firstName" label="First Name" />
      <FormKit type="text" name="lastName" label="Last Name" />
    </FormKit>
    <FormKit type="text" name="url" />
    <FormKit type="text" name="regex" />
    <FormKit type="text" name="startsWith" />
    <FormKit type="text" name="endsWith" />
    <FormKit type="text" name="startsAndEndsWith" />
    <FormKit type="date" name="dateBefore" />
    <FormKit type="date" name="dateAfter" />
    <FormKit type="checkbox" name="arrayMin" :options="['a', 'b', 'c']" />
    <FormKit type="checkbox" name="arrayMax" :options="['a', 'b', 'c']" />
  </FormKit>
</template>
