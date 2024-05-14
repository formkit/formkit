<script setup lang="ts">
import { FormKitNode } from '@formkit/core'
import { createTypeboxPlugin } from '../../../../packages/typebox/src'
import { Type } from '@sinclair/typebox'
import { FormatRegistry } from '@sinclair/typebox'
import { TypeCompiler } from '@sinclair/typebox/compiler'

// http://www.w3.org/TR/html5/forms.html#valid-e-mail-address (search for 'wilful violation')
const emailPattern = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i
FormatRegistry.Set('email', (value) => emailPattern.test(value))

// Source: https://gist.github.com/dperini/729294
const urlPattern = /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu
FormatRegistry.Set('url', (value) => urlPattern.test(value))

const typeboxSchema = Type.Object({
  personalInfo: Type.Object({
    firstName: Type.String({minLength: 3, maxLength: 25}),
    lastName: Type.String({minLength: 3, maxLength: 25}),
  }),
  email: Type.String({format: 'email'}),
  message: Type.String({minLength: 10, maxLength: 1000}),
  url: Type.String({format: 'url'}),
  regex: Type.String({pattern: '^[a-zA-Z0-9]{3,30}$'}),
  startsWith: Type.String({pattern: '^foo'}),
  endsWith: Type.String({pattern: 'bar$'}),
  startsAndEndsWith: Type.String({pattern: '^foo.*bar$'}),
  // dateBefore: Type.Date({maximumTimestamp: (new Date('2023-04-05')).getTime()}),
  // dateAfter: Type.Date({minimumTimestamp: (new Date('1900-01-01')).getTime()}),
  arrayMin: Type.Array(Type.String(), {minItems: 2}),
  arrayMax: Type.Array(Type.String(), {maxItems: 2}),
  missing: Type.Number(),
})

const typeboxSchemaMinimal = Type.Object({
  personalInfo: Type.Object({
    firstName: Type.String({minLength: 3, maxLength: 25}),
    lastName: Type.String({minLength: 3, maxLength: 25}),
  }),
  email: Type.Transform(Type.String({format: 'email'}))
    .Decode(() => 'andrew@formkit.com')
    .Encode(value => value),
  arrayMin: Type.Array(Type.String(), {minItems: 2}),
})

const [typeboxPluginMinimal, submitHandlerMinimal] = createTypeboxPlugin(
  typeboxSchemaMinimal,
  async (formData) => {
    console.log(formData)
    await new Promise((r) => setTimeout(r, 2000))
    alert('Form was submitted!')
  }
)

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
  // dateBefore: '3000-01-01',
  // dateAfter: '1899-04-05',
  arrayMin: ['a'],
  arrayMax: ['a', 'b', 'c'],
  missing: 10,
}

const checker = TypeCompiler.Compile(typeboxSchema)
const typeboxErrors = checker.Errors(invalidValues)

const [typeboxPlugin, submitHandler] = createTypeboxPlugin(
  typeboxSchema,
  async (formData) => {
    console.log(formData)
    await new Promise((r) => setTimeout(r, 2000))
  }
)

function setupFormNode(node: FormKitNode) {
  node.setTypeboxErrors(typeboxErrors)
}
</script>

<template>
  <h1>Typebox validation</h1>

  <h2>Minimal form</h2>
  <FormKit
    type="form"
    :plugins="[typeboxPluginMinimal]"
    @submit="submitHandlerMinimal"
  >
    <FormKit type="group" name="personalInfo">
      <FormKit type="text" name="firstName" label="First Name" />
      <FormKit type="text" name="lastName" label="Last Name" />
    </FormKit>
    <FormKit type="text" name="email" label="Your email" />
    <FormKit
      type="checkbox"
      name="arrayMin"
      label="Select at least two options"
      :options="['Validation', 'Type-Safety', 'Composability']"
    />
  </FormKit>

  <h2>Robust form</h2>
  <FormKit
    type="form"
    :plugins="[typeboxPlugin]"
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
<!--    <FormKit type="date" name="dateBefore" />-->
<!--    <FormKit type="date" name="dateAfter" />-->
    <FormKit type="checkbox" name="arrayMin" :options="['a', 'b', 'c']" />
    <FormKit type="checkbox" name="arrayMax" :options="['a', 'b', 'c']" />
  </FormKit>
</template>
