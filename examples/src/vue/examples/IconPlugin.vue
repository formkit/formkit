<template>
  <h1>Icon Plugin</h1>
  <FormKit
    id="form"
    v-model="data"
    type="form"
    :plugins="[iconPlugin]"
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
      icon-suffix="ethereum"
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
      icon="formkit"
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
      ref="passwordNode"
      name="password"
      :type="passwordInputType"
      label="A fancy password input"
      value="mySecretPassword!"
      icon="password"
      :icon-suffix="passwordIcon"
      @icon-click="handleIconClick"
    />
  </FormKit>

  <button @click="changeIcon">Change Password visibility</button>
  password icon: {{ passwordIcon }}
  <pre>{{ data }}</pre>

  <ul class="icon-grid">
    <li
      v-for="icon in iconList"
      :key="icon"
    >
      <span
        class="icon"
        v-html="getIcon(icon)"
      />
      <span class="label">
        {{ icon }}
      </span>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { FormKitNode } from '@formkit/core'
import { getIcon, iconRegistry, createIconPlugin, applicationIcons, brandIcons, cryptoIcons, currencyIcons, directionalIcons, fileIcons, inputIcons, paymentIcons } from '@formkit/icons'
import { setErrors } from '@formkit/vue'
import { ref } from 'vue'

const iconPlugin = createIconPlugin({
  formkit: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M4 0.0182495H0V4.01533H4V8.01167L7.9989 8.01167V12.0088H4V16.0058H0V20.0029H4V16.0058H8V12.0088H11.9989V8.01167L8 8.01167V4.01459H4V0.0182495ZM11.9983 20.0029H15.9977H15.9983H19.9972H19.9977H23.9972V24H19.9977H19.9972H15.9983H15.9977H11.9983V20.0029Z" fill="currentColor"/></svg>`,
  ...applicationIcons,
  ...brandIcons,
  ...cryptoIcons,
  ...currencyIcons,
  ...directionalIcons,
  ...fileIcons,
  ...inputIcons,
  ...paymentIcons
})

const iconList = Object.keys(iconRegistry)

const data = ref({})
const passwordIcon = ref('eyeClosed')
const passwordInputType = ref('password')
const passwordNode = ref(null)

const submitHandler = async function () {
  await new Promise(r => setTimeout(r, 2000))
  setErrors('form', ['This isn’t setup to actually do anything.'])
}

const changeIcon = function () {
  passwordIcon.value = passwordIcon.value === 'eye' ? 'eyeClosed' : 'eye'
  passwordInputType.value = passwordIcon.value === 'eye' ? 'text' : 'password'
}

const handleIconClick = function (_node:FormKitNode, sectionKey:string) {
  if (sectionKey === 'suffix') {
    changeIcon()
  }
}
</script>

<style>
.icon-grid {
  padding: 0;
  margin: 0;
  display: flex;
  list-style-type: none;
  flex-wrap: wrap;
}
.icon-grid li {
  width: 5em;
  height: 5em;
  margin: 0.5em;
  padding: 1em;
  display: flex;
  flex-direction: column;
  justify-content: center;
  font-family: sans-serif;
  border: 1px solid var(--fk-color-border);
  border-radius: var(--fk-border-radius);
}
.icon-grid .icon {
  margin: auto;
}
.icon-grid .icon svg {
  width: 100%;
  max-width: 3em;
  max-height: 3em;
  display: block;
}
.icon-grid li:hover {
  color: var(--fk-color-primary);
}
.icon-grid .label {
  display: block;
  margin-top: auto;
  text-align: center;
  font-size: 0.8em;
  opacity: 0.5;
}
</style>
