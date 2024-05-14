<template>
  <div class="selector-area">
    <select
      ref="currency"
      :class="context.classes.selector"
      :value="context._value.currency"
      @change="input"
    >
      <option value="€">
        Euros
      </option>
      <option value="$">
        Dollars
      </option>
      <option value="£">
        Pounds
      </option>
    </select>
  </div>
  <input
    ref="amount"
    :value="context._value.amount"
    v-bind="context.attrs"
    :class="context.classes.input"
    @input="input"
  >
</template>

<script lang="ts" setup>
import type { PropType} from 'vue';
import { toRef, ref } from 'vue'
import type { FormKitFrameworkContext } from '@formkit/core';

const props = defineProps({
  context: {
    type: Object as PropType<FormKitFrameworkContext & { currency: string }>,
    required: true
  }
})

const currency = ref<HTMLSelectElement | null>(null)
const amount = ref<HTMLInputElement | null>(null)

const context = toRef(props, 'context')

const input = () => {
  if (currency.value && amount.value) {
    props.context.node.input({
      currency: currency.value.value,
      amount: amount.value.value
    })
  }
}
</script>

<style scoped>
.selector-area {
  padding: var(--formkit-input-padding);
  background-color: #e4e4e4;
  height: 100%;
}
.formkit-selector {
  appearance: none;
  border: 0;
  background-color: transparent;
}

.formkit-selector:focus {
  outline: none;
}
</style>
