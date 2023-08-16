<script setup lang="ts">
import { FormKitNode } from '@formkit/core'
import { createAutoHeightTextareaPlugin } from '../../../../packages/addons/src/plugins/autoHeightTextarea'

const value = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`

function changeProgramatically(node: FormKitNode) {
  setTimeout(() => node.input('sasha'), 1000)
}
</script>

<template>
  <FormKit
    type="textarea"
    label="I have an auto-height plugin without max auto height"
    help="This textarea will grow as you type"
    auto-height
    :plugins="[createAutoHeightTextareaPlugin()]"
    :value="value"
    @node="changeProgramatically"
  />

  <FormKit
    type="textarea"
    label="I have an auto-height plugin with a max auto height of 200px"
    help="This textarea will grow as you type"
    auto-height
    :max-auto-height="300"
    :plugins="[createAutoHeightTextareaPlugin()]"
    :value="value"
  />
</template>
