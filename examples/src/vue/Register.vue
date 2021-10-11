<template>
  <div class="container">
    <h2>Registration</h2>
    <FormKit
      type="form"
      @input="setLocalValue"
    >
      <div class="double">
        <FormKit
          label="First name"
          name="first"
          validation="required"
          type="text"
          ref="first"
        />
        <FormKit
          label="Last name"
          name="last"
          validation="required"
          type="text"
        />
      </div>
      <FormKit
        type="group"
        name="address"
      >
        <FormKit
          label="Street address"
          name="street"
          validation="required"
          type="text"
        />
        <FormKit
          label="Street address line 2"
          name="street_2"
          validation="required"
          type="text"
        />
        <div class="triple">
          <FormKit
            label="City"
            name="city"
            validation="required"
            type="text"
          />
          <FormKit
            label="State"
            name="state"
            validation="required"
            type="select"
            :options="{
              ne: 'Nebraska'
            }"
          />
          <FormKit
            label="Zip"
            name="zip"
            validation="required|number"
            type="text"
          />
        </div>
      </FormKit>
    </FormKit>
    <pre>{{ data.value }}</pre>
  </div>
</template>
<script lang="ts" setup>
import { reactive, ref } from "vue"

const data = reactive({
  value: {}
})

const name = ref<any>(null)

const setLocalValue = (value: Record<string, any>) => {
  data.value = { ...value }
  console.log(name)
}
</script>

<style>
html,
body {
  border: 0;
  margin: 0;
  background: linear-gradient(135deg, #1e24bf, #ff9357);
}
pre {
  font-size: 16px;
  background-color: black;
  color: #f8cb67;
  margin: 2em -2em -2em -2em;
  padding: 2em;
  border-radius: 0 0 1em 1em;
}
.container {
  width: 600px;
  overflow: hidden;
  padding: 2em;
  background-color: white;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 1em;
  box-shadow: 0 0 2em rgba(0, 0, 0, .1);
}
.inputs {
  display: flex;
}

.outer {
  margin-bottom: 1em;
}

.double,
.triple {
  display: flex;
  justify-content: space-between;
}

.double > div {
  width: calc(50% - 1em);
}

.triple > div {
  width: calc(33% - 1em);
}

select {
  font-size: 1em;
  width: 100%;
  box-sizing: border-box;
  height: 2em;
}

ul {
  list-style-type: none;
  margin: 0;
  padding: 0;
}
li {
  font-size: .9em;
  color: red;
}
</style>
