<template>
<button @click="runWithClone">Run clone test {{ cloneTime }}ms</button>
<button @click="runWithLiteral">Run literal test {{ literalTime }}ms</button>
<button @click="runWithJSON">Run json test {{ jsonTime }}ms</button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const cloneTime = ref(0)
const literalTime = ref(0)
const jsonTime = ref(0)
function clone<T extends Record<string, unknown> | unknown[] | null>(
  obj: T
): T {
  if (obj === null || obj instanceof RegExp || obj instanceof Date) return obj
  if (Array.isArray(obj)) {
    return obj.map((value) => {
      if (typeof value === 'object') return clone(value as unknown[])
      return value
    }) as T
  }
  return Object.keys(obj).reduce((newObj, key) => {
    newObj[key] =
      typeof obj[key] === 'object' ? clone(obj[key] as unknown[]) : obj[key]
    return newObj
  }, {} as Record<string, unknown>) as T
}

const runWithClone = () => {
  const input = {
      $el: 'input',
      bind: '$attrs',
      attrs: {
        type: '$type',
        disabled: '$disabled',
        class: '$classes.input',
        name: '$node.name',
        onInput: '$handlers.DOMInput',
        onBlur: '$handlers.blur',
        value: '$_value',
        id: '$id',
      },
    }
    const start = performance.now()
    for (let i = 0; i < 10000; i++) {
      clone(input)
    }
    cloneTime.value = performance.now() - start
}

const runWithLiteral = () => {
  const input = () => ({
      $el: 'input',
      bind: '$attrs',
      attrs: {
        type: '$type',
        disabled: '$disabled',
        class: '$classes.input',
        name: '$node.name',
        onInput: '$handlers.DOMInput',
        onBlur: '$handlers.blur',
        value: '$_value',
        id: '$id',
      },
    })
    const start = performance.now()
    for (let i = 0; i < 10000; i++) {
      input()
    }
    literalTime.value = performance.now() - start
}

const runWithJSON = () => {
  const input = JSON.stringify({
      $el: 'input',
      bind: '$attrs',
      attrs: {
        type: '$type',
        disabled: '$disabled',
        class: '$classes.input',
        name: '$node.name',
        onInput: '$handlers.DOMInput',
        onBlur: '$handlers.blur',
        value: '$_value',
        id: '$id',
      },
    })
    const start = performance.now()
    for (let i = 0; i < 10000; i++) {
      JSON.parse(input)
    }
    jsonTime.value = performance.now() - start
}
</script>
