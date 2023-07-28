<script setup lang="ts">
import { createAutoHeightTextareaPlugin } from '@formkit/addons'
import { FormKitRoot } from '@formkit/vue'

const value = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`
const autoHeightPlugin = createAutoHeightTextareaPlugin()
</script>

<template>
  <FormKitRoot>
    <FormKit
      type="textarea"
      label="I have an auto-height plugin"
      help="This textarea will grow as you type"
      auto-height
      :plugins="[autoHeightPlugin]"
      :value="value"
    />

    <FormKit type="multi-step">
      <FormKit type="step" name="sirst">
        <FormKit type="text" label="Foobar" />
      </FormKit>
      <FormKit type="step" name="second">
        <FormKit type="text" label="Bar bar" />
      </FormKit>
    </FormKit>
  </FormKitRoot>
</template>
