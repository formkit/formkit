<script setup lang="ts">
const submitHandler = async function (data: { email: string }) {
  await new Promise((r) => setTimeout(r, 2000))
  console.log(data)
}
</script>

<template>
  <h1>Basic Form</h1>
  <FormKit type="form" @submit="submitHandler">
    <FormKit
      type="email"
      name="email"
      label="Email address"
      help="What is your email address?"
      placeholder="jon@foo.com"
      outer-class="my-class !formkit-outer"
    />
    <FormKit type="group">
      <FormKit type="number" label="Age" />
      <FormKit type="text" label="Name" />
    </FormKit>
    <FormKit
      label="What's your favorite plant?"
      multiple
      type="select"
      name="planet"
      placeholder="Select the best planet"
      :value="['Mercury', 'Venus']"
      :options="[
        'Mercury',
        'Venus',
        'Earth',
        'Mars',
        'Jupiter',
        'Saturn',
        'Uranus',
        'Neptune',
      ]"
    />
  </FormKit>
</template>
