<template>
  <div class="container">
    <div class="sample-input">
      <FormKit
        type="form"
      >
        <FormKit
          label="Invalid input"
          placeholder="Enter something here..."
          validation="required"
          validation-visibility="live"
        />
        <FormKit
          label="Disabled input"
          :disabled="true"
          placeholder="Enter something here..."
        />
        <FormKit
          label="Complete input"
          value="I have a value"
        />
        <FormKit
          label="Complete input"
          type="select"
          multiple
          :options="['option-1', 'option-2']"
          value="I have a value"
        />
      </FormKit>
    </div>
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 60px;
}

.container {
  margin: auto;
  display: flex;
  justify-content: center;
}
</style>
