<script setup lang="ts">
import { FormKitIcon } from '@formkit/vue'
import { ref } from 'vue'

const data = ref({})
const passwordIcon = ref('eyeClosed')
const passwordInputType = ref('password')
const passwordNode = ref(null)

const inlineSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 16"><path d="M7.5,14c-.2,0-.4-.08-.56-.23-1.06-1.04-4.58-4.59-5.49-6.34-.63-1.2-.59-2.7,.09-3.83,.61-1.01,1.67-1.59,2.9-1.59,1.56,0,2.53,.81,3.06,1.63,.53-.82,1.5-1.63,3.06-1.63,1.23,0,2.29,.58,2.9,1.59,.68,1.13,.72,2.63,.09,3.83-.92,1.76-4.43,5.3-5.49,6.34-.16,.16-.36,.23-.56,.23ZM4.44,3c-.88,0-1.61,.39-2.04,1.11-.51,.83-.53,1.95-.06,2.85,.66,1.26,3.07,3.88,5.17,5.96,2.09-2.08,4.51-4.69,5.17-5.96,.47-.9,.44-2.02-.06-2.85-.43-.72-1.16-1.11-2.04-1.11-2.12,0-2.55,1.9-2.57,1.98h-.98c-.02-.08-.47-1.98-2.57-1.98Z" fill="currentColor"/></svg>`

const submitHandler = async function () {
  await new Promise(r => setTimeout(r, 2000))
}

const changeIcon = function () {
  passwordIcon.value = passwordIcon.value === 'eye' ? 'eyeClosed' : 'eye'
  passwordInputType.value = passwordIcon.value === 'eye' ? 'text' : 'password'
}
</script>

<template>
  <h1>Theme Plugin</h1>
  <div class="example-icon-component">
    <h5>Example <code>FormKitIcon</code> components</h5>
    <FormKitIcon :icon="inlineSVG" />
    <FormKitIcon icon="table" />
  </div>
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
      prefix-icon="email"
    />
    <FormKit
      id="star"
      name="star"
      type="text"
      label="Suffix icon"
      suffix-icon="ethereum"
    />
    <FormKit
      id="fruit"
      name="fruit-1"
      type="select"
      label="Select with prefix icon"
      placeholder="Select some pie"
      prefix-icon="apple"
      :options="{
        apple: 'Apple pie',
        pumpkin: 'Pumpkin pie',
        peach: 'Peach cobbler'
      }"
    />
    <FormKit
      id="fruit-2"
      name="fruit-2"
      type="select"
      label="Select with prefix and select icon"
      placeholder="Select some pie"
      prefix-icon="apple"
      select-icon="caretDown"
      :options="{
        apple: 'Apple pie',
        pumpkin: 'Pumpkin pie',
        peach: 'Peach cobbler'
      }"
    />
    <FormKit
      id="fruit-3"
      name="fruit-3"
      type="select"
      label="select with prefix, select, and suffix icon"
      placeholder="Select some pie"
      prefix-icon="apple"
      select-icon="caretDown"
      suffix-icon="settings"
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
      prefix-icon="apple"
      suffix-icon="formkit"
    />
    <FormKit
      id="custom_icon"
      name="custom_icon"
      type="text"
      label="Custom icon"
      value="FormKit"
      prefix-icon="formkit"
    />
    <FormKit
      id="inline_icon"
      name="inline_icon"
      type="text"
      label="Inline SVG icon"
      :prefix-icon="inlineSVG"
    />
    <FormKit
      id="invalid"
      name="invalid"
      type="text"
      label="Invalid Icon"
      value=""
      prefix-icon="doesNotExist"
    />
    <FormKit
      id="range"
      name="range"
      type="range"
      label="a range input"
      prefix-icon="apple"
      suffix-icon="bitcoin"
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
      prefix-icon="color"
    />
    <FormKit
      id="color_2"
      name="color"
      type="color"
      label="a color input with suffix icon"
      suffix-icon="settings"
    />
    <FormKit
      id="color_3"
      name="color"
      type="color"
      label="a color input with both icons"
      prefix-icon="color"
      suffix-icon="settings"
    />
    <FormKit
      id="date"
      name="date"
      type="date"
      label="a date input"
      prefix-icon="date"
      suffix-icon="bitcoin"
    />
    <FormKit
      id="datetime"
      name="datetime"
      type="datetime-local"
      label="a datetime input"
      prefix-icon="datetime"
      suffix-icon="bitcoin"
    />
    <FormKit
      id="file"
      name="file"
      type="file"
      label="a file input"
      suffix-icon="bitcoin"
    />
    <FormKit
      id="file_multiple"
      name="file_multiple"
      type="file"
      label="a multi-file input"
      prefix-icon="file"
      file-item-icon="happy"
      suffix-icon="bitcoin"
      :multiple="true"
    />
    <FormKit
      id="file_no_icon"
      name="file_no_icon"
      type="file"
      label="a file input with no file item icons"
      prefix-icon="file"
      :file-item-icon="false"
      :multiple="true"
    />
    <FormKit
      type="button"
      label="a button input"
      prefix-icon="tag"
      suffix-icon="submit"
    />
    <FormKit
      type="submit"
      label="a submit input"
      prefix-icon="tag"
      suffix-icon="submit"
    />
    <FormKit
      id="password"
      ref="passwordNode"
      name="password"
      :type="passwordInputType"
      label="A fancy password input"
      value="mySecretPassword!"
      prefix-icon="password"
      :suffix-icon="passwordIcon"
      @suffix-icon-click="changeIcon"
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
.example-icon-component {
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
