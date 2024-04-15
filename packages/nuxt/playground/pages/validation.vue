<template>
  <div>
    <FormKit id="test-form" type="form">
      <FormKit
        name="username"
        label="User name"
        placeholder="Enter your user name here."
        validation="required"
      />
    </FormKit>
  </div>
</template>

<style>
.my-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 1em;
}
</style>
