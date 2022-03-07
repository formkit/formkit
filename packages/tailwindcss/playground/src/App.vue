<template>
  <div class="container">
    <div class="sample-input">
      <FormKit
        type="form"
      >
        <FormKit
          type="group"
          v-model="formData"
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
      </FormKit>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  setup() {
    const recommendation = ref('10')
    const formData = ref({})

    return {
      recommendation,
      formData
    }
  }
}
</script>


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

.side-by-side {
  display: flex;
  align-items: flex-start;
}

pre.range-output {
  background: #eee;
  border-radius: 0.5em;
  text-align: center;
  margin-left: 1em;
  margin-top: 1.5em;
  font-weight: bold;
  padding: 0.5em;
  line-height: 1;
  width: 1.5em;
}

pre.form-data {
  box-sizing: border-box;
  background: #eee;
  border: 1px solid #ccc;
  width: 100%;
  padding: 1em;
  border-radius: 0.5em;
}
</style>
