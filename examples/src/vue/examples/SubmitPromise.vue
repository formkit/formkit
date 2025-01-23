<template>
  <div>
    <h2>Test form blocking on error</h2>

    <FormKit
      type="form"
      @submit="submitHandler"
    >
      <template #default="{ state: { loading } }">  
        <FormKitMessages />
        <FormKit
          type="text"
          name="username"
          label="Username"
          validation="required"
        />
        <FormKit
          type="password"
          name="password"
          label="Password"
          validation="required"
        />
        <div v-if="loading">Submitting...</div>
      </template>
    </FormKit>
  </div>
</template>

<script setup>
const submitHandler = async (formData) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Simulate API error
  throw new Error('Invalid credentials. Please try again.')
}
</script>

<style scoped>
.formkit-form {
  max-width: 400px;
  margin: 0 auto;
}
</style>
