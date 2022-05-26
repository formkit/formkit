<script setup>
import { ref, computed } from 'vue'
import { createIconPlugin } from '@formkit/icons'
import { library as fontAwesomeLibrary } from '@fortawesome/fontawesome-svg-core'
import { faStar, faBell } from '@fortawesome/free-solid-svg-icons'
fontAwesomeLibrary.add(faStar, faBell)

const showPassword = ref(false)
const computedIcon = computed(() => {
  if (showPassword.value) {
    return ['fas', 'bell']
  }
  return ['fas', 'star']
})

function handleIconClick(node, location) {
  if (location === 'suffix') {
    showPassword.value = !showPassword.value
    console.log('icon clicked', showPassword.value)
  }
}

const fontAwesome = (iconSchemaValue) => {
  return {
    $cmp: 'FontAwesomeIcon',
    props: {
      icon: iconSchemaValue
    }
  }
}
</script>

<template>
  <h1>Icon Plugin - Font Awesome</h1>
  <FormKit
    :plugins="[createIconPlugin(fontAwesome)]"
    type="text"
    label="Input with Font Awesome Icons"
    :icon-prefix="['fas', 'star']"
    :icon-suffix="computedIcon"
    @icon-click="handleIconClick"
    help="Using the icons package from @formkit/addons"
  />
</template>
