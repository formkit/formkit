<template>
  <h1>Icon Plugin</h1>
  <FormKit
    id="form"
    v-model="data"
    type="form"
    @submit="submitHandler"
  >
    <FormKit
      type="email"
      name="email"
      label="Prefix icon"
      placeholder="jon@foo.com"
      validation="required|email|length:16,9"
      validation-visibility="live"
      icon="email"
    />
    <FormKit
      id="star"
      name="star"
      type="text"
      label="Suffix icon"
      icon-suffix="customStar"
    />
    <FormKit
      id="fruit"
      name="fruit"
      type="select"
      label="Icon with select input"
      placeholder="Select some pie"
      icon="apple"
      :options="{
        apple: 'Apple pie',
        pumpkin: 'Pumpkin pie',
        peach: 'Peach cobbler'
      }"
    />
    <FormKit
      id="framework"
      name="framework"
      type="text"
      label="Inline SVG icon"
      value="FormKit"
      :icon="formkitLogo"
    />
    <FormKit
      id="invalid"
      name="invalid"
      type="text"
      label="Invalid Icon"
      value=""
      icon="doesNotExist"
    />
    <FormKit
      id="password"
      name="password"
      :type="passwordInputType"
      label="A fancy password input"
      value="mySecretPassword!"
      icon-prefix="password"
      :icon-suffix="passwordIcon"
    />
  </FormKit>

  <button @click="changeIcon">Change Password visibility</button>
  password icon: {{ passwordIcon }}
  <pre>{{ data }}</pre>
</template>

<script setup lang="ts">
import { setErrors } from '@formkit/vue'
import { ref } from 'vue'

const data = ref({})
const passwordIcon = ref('eyeClosed')
const passwordInputType = ref('password')

const formkitLogo = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M4 0.0182495H0V4.01533H4V8.01167L7.9989 8.01167V12.0088H4V16.0058H0V20.0029H4V16.0058H8V12.0088H11.9989V8.01167L8 8.01167V4.01459H4V0.0182495ZM11.9983 20.0029H15.9977H15.9983H19.9972H19.9977H23.9972V24H19.9977H19.9972H15.9983H15.9977H11.9983V20.0029Z" fill="currentColor"/></svg>`

const submitHandler = async function () {
  await new Promise(r => setTimeout(r, 2000))
  setErrors('form', ['This isn’t setup to actually do anything.'])
}

const changeIcon = function () {
  passwordIcon.value = passwordIcon.value === 'eye' ? 'eyeClosed' : 'eye'
  passwordInputType.value = passwordIcon.value === 'eye' ? 'text' : 'password'
}
</script>

<style>
.formkit-inner:focus-within .formkit-icon.formkit-prefix {
  color: var(--fk-color-primary);
}

.formkit-icon {
  width: 3em;
  padding: 0.75em;
  flex-grow: 1;
  flex-shrink: 0;
  display: flex;
  align-self: stretch;
}

.formkit-icon.formkit-prefix {
  border-radius: var(--fk-border-radius-tl) 0 0 var(--fk-border-radius-bl) ;
  background: var(--fk-bg-decorator);
  box-shadow: 1px 0 0 0 rgba(0,0,0,0.33);
}

.formkit-icon.formkit-suffix {
  width: 2.25em;
  padding-left: 0em;
}

.formkit-icon svg {
  margin: auto;
  max-height: 1em;
  max-width: 1.5em;
}
</style>
