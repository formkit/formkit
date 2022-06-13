<script setup lang="ts">
import { FormKitNode } from '@formkit/core'
// import { applicationIcons, brandIcons, cryptoIcons, currencyIcons, directionalIcons, fileIcons, inputIcons, paymentIcons } from '@formkit/icons'
import { setErrors, FormKitIcon } from '@formkit/vue'
import { ref } from 'vue'

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

<template>
  <h1>Theme Plugin</h1>
  <FormKitIcon icon="avatarMan" />
  <FormKitIcon icon="add" />
  <FormKitIcon icon="visa" />
  <FormKitIcon icon="close" />
  <FormKit
    id="form"
    v-model="data"
    type="form"
    :actions="false"
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
      icon-suffix="formkit"
      :options="{
        apple: 'Apple pie',
        pumpkin: 'Pumpkin pie',
        peach: 'Peach cobbler'
      }"
    />
    <FormKit
      id="textarea"
      name="textarea"
      type="textarea"
      label="Text Area input"
      placeholder="Write something"
      icon="apple"
      icon-suffix="formkit"
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
      id="single_checkbox"
      name="single_checkbox"
      type="checkbox"
      label="a single_checkbox input"
      icon="formkit"
      icon-suffix="bitcoin"
    />
    <FormKit
      id="radio"
      name="radio"
      type="radio"
      label="a radio input"
      :options="{
        apple: 'Apple pie',
        pumpkin: 'Pumpkin pie',
        peach: 'Peach cobbler'
      }"
      icon="formkit"
      icon-suffix="apple"
    />
    <FormKit
      id="checkbox"
      name="checkbox"
      type="checkbox"
      label="a checkbox input"
      :options="{
        apple: 'Apple pie',
        pumpkin: 'Pumpkin pie',
        peach: 'Peach cobbler'
      }"
      icon="formkit"
      icon-suffix="bitcoin"
    />
    <FormKit
      id="range"
      name="range"
      type="range"
      label="a range input"
      icon="formkit"
      icon-suffix="formkit"
    />
    <FormKit
      id="color"
      name="color"
      type="color"
      label="a color input with no icons"
    />
    <FormKit
      id="color_1"
      name="color"
      type="color"
      label="a color input with prefix icon"
      icon="color"
    />
    <FormKit
      id="color_2"
      name="color"
      type="color"
      label="a color input with suffix icon"
      icon-suffix="settings"
    />
    <FormKit
      id="color_3"
      name="color"
      type="color"
      label="a color input with both icons"
      icon="color"
      icon-suffix="settings"
    />
    <FormKit
      id="date"
      name="date"
      type="date"
      label="a date input"
      icon="date"
      icon-suffix="bitcoin"
    />
    <FormKit
      id="datetime"
      name="datetime"
      type="datetime-local"
      label="a datetime input"
      icon="datetime"
      icon-suffix="bitcoin"
    />
    <FormKit
      id="file"
      name="file"
      type="file"
      label="a file input"
      icon="filePdf"
      icon-suffix="bitcoin"
    />
    <FormKit
      id="file_multiple"
      name="file_multiple"
      type="file"
      label="a multi-file input"
      icon="file"
      icon-suffix="bitcoin"
      :multiple="true"
    />
    <FormKit
      type="button"
      label="a button input"
      icon="tag"
      icon-suffix="submit"
    />
    <FormKit
      type="submit"
      label="a submit input"
      icon="tag"
      icon-suffix="submit"
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

  <!-- <ul class="icon-grid">
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
  </ul> -->
</template>

<style>
.formkit-icon {
  display: block;
  max-width: 5em;
}
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
