<script setup>
  import { ref } from 'vue'

  const icon = ref('ethereum')

  function updateIcon () {
    icon.value = icon.value === 'check' ? 'ethereum' : 'check'
  }
</script>

<template>
  <FormKit
    type="button"
    label="change icon"
    @click="updateIcon"
  />

  <FormKit
    v-slot="{ value }"
    type="form"
    :actions="false"
  >
    <FormKit
      type="text"
      label="A standard input"
    />

    <FormKit type="multi-step">
      <FormKit
        key="firstStep"
        type="step"
        name="firstStep"
      >
        <FormKit
          type="text"
          label="Your name"
          name="name"
          validation="required"
        />
      </FormKit>

      <FormKit
        key="secondStep"
        type="step"
        name="secondStep"
      >
        <FormKit
          type="range"
          label="Your Age"
          name="age"
        />
      </FormKit>

      <FormKit
        key="thirdStep"
        name="thirdStep"
        label="Application"
        type="step"
      >
        <FormKit
          type="textarea"
          name="story"
          label="Your Story"
          validation="required"
        />
      </FormKit>

      <FormKit
        key="fourthStep"
        name="fourthStep"
        label="Sources"
        type="step"
      >
        <template #stepNext>
          <FormKit type="submit" />
        </template>

        <FormKit
          type="textarea"
          name="closingThoughts"
          label="Your Closing Thoughts"
        />
      </FormKit>
    </FormKit>

    <FormKit
      type="textarea"
      label="A standard input"
    />

    <pre>{{ value }}</pre>
  </FormKit>
</template>

<style>
:root {
  --multistep-color-border: #ccccd7;
  --multistep-color-tab: #eeeef4;
  --multistep-color-tab-active: #ffffff;
  --multistep-color-success: #54A085;
  --multistep-color-danger: #ea0000;
  --multistep-color-tab-active-text: #000000
  --multistep-color-tab-text: #767676;
  --multistep-radius: 0.4em;
  --multistep-shadow: 0.25em 0.25em 1em 0 rgb(0 0 0 / 10%);
}

.formkit-outer[data-type="multi-step"] > .formkit-wrapper {
  max-width: 32em;
  box-shadow: var(--multistep-shadow);
  border-radius: var(--multistep-radius);
}

.formkit-outer[data-type="multi-step"] > .formkit-wrapper[data-tab-style="progress"] {
  box-shadow: none;
}

.formkit-outer[data-type="multi-step"] > .formkit-wrapper .formkit-wrapper {
  max-width: none;
}

.formkit-outer[data-type="multi-step"] .formkit-tabs {
  display: flex;
  overflow: auto;
  align-items: center;
}

.formkit-outer[data-type="multi-step"] .formkit-tab {
  appearance: none;
  border: none;
  background: none;
  cursor: pointer;
  height: 100%;
}

.formkit-outer[data-type="multi-step"] .formkit-tab[data-active="true"] {
  font-weight: bold;
}

.formkit-outer[data-type="multi-step"] .formkit-badge {
  background: var(--multistep-color-danger);
  color: #fff;
  width: 1.125rem;
  height: 1.125rem;
  display: flex;
  font-size: 0.6rem;
  border-radius: 999em;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  position: absolute;
  text-indent: -0.15em;
}

.formkit-outer[data-type="multi-step"] .formkit-tab[data-valid="true"] .formkit-badge {
  background: var(--multistep-color-success);
}

.formkit-outer[data-type="multi-step"] .formkit-badge .formkit-icon {
  max-width: 100%;
}

.formkit-outer[data-type="multi-step"] [data-tab-style="tab"] .formkit-tabs {
  background: var(--multistep-color-tab);
  border-radius: var(--multistep-radius) var(--multistep-radius) 0 0;
  border: 1px solid var(--multistep-color-border);
}

.formkit-outer[data-type="multi-step"] [data-tab-style="tab"] .formkit-tab {
  font-size: 0.875rem;
  padding: 1rem 1.5rem;
  background: var(--multistep-color-tab);
  box-shadow: -1px 0 0 0 var(--multistep-color-border);
  color: var(--multistep-color-tab-text);
  flex-grow: 1;
  flex-shrink: 1;
  position: relative;
  user-select: none;
  text-align: center;
}
.formkit-outer[data-type="multi-step"] [data-tab-style="tab"] .formkit-tab:last-child {
  box-shadow: -1px 0 0 0 var(--multistep-color-border), 1px 0 0 0 var(--multistep-color-border);
}

.formkit-outer[data-type="multi-step"] [data-tab-style="tab"] .formkit-tab[data-active="true"] {
  background: var(--multistep-color-tab-active);
  color: var(--multistep-color-tab-active-text);
}

.formkit-outer[data-type="multi-step"] [data-tab-style="tab"] .formkit-badge {
  line-height: 0;
  top: 0.25rem;
  right: 0.25rem;
}

.formkit-outer[data-type="multi-step"] [data-tab-style="progress"] .formkit-tabs {
  margin-bottom: 2em;
  margin-top: 2em;
  justify-content: space-around;
  overflow: visible;
}

.formkit-outer[data-type="multi-step"] [data-tab-style="progress"] .formkit-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-grow: 1;
  flex-shrink: 0;
  position: relative;
}

.formkit-outer[data-type="multi-step"] [data-tab-style="progress"] .formkit-tab-label {
  position: absolute;
  top: 100%;
  width: 100%;
  white-space: nowrap;
}

.formkit-outer[data-type="multi-step"] [data-tab-style="progress"] .formkit-tab::before {
  content: '';
  display: block;
  width: 1.5em;
  height: 1.5em;
  border: 5px solid var(--multistep-color-border);
  border-radius: 999em;
  margin-bottom: 0.5em;
  background: #ffffff;
  z-index: 2;
}

.formkit-outer[data-type="multi-step"] [data-tab-style="progress"] .formkit-tab[data-active="true"]::before {
  border-color: var(--multistep-color-success);
  background: var(--multistep-color-success);
}

.formkit-outer[data-type="multi-step"] [data-tab-style="progress"] .formkit-tab::after {
  content: '';
  display: block;
  height: 0.25rem;
  width: 100%;
  position: absolute;
  top: 0.66em;
  left: calc(50% + 0.5em);
  background: var(--multistep-color-border)
}

.formkit-outer[data-type="multi-step"] [data-tab-style="progress"] .formkit-tab:last-child::after {
  display: none;
}

.formkit-outer[data-type="multi-step"] [data-tab-style="progress"] .formkit-tab[data-valid="true"][data-visited="true"]::after {
  background: var(--multistep-color-success);
}

.formkit-outer[data-type="multi-step"] [data-tab-style="progress"] .formkit-tab .formkit-badge {
  width: 1.5rem;
  height: 1.5rem;
  top: -1px;
  z-index: 3;
}

.formkit-outer[data-type="multi-step"] .formkit-steps {
  border: 1px solid var(--multistep-color-border);
  border-top: none;
  border-radius: 0 0 var(--multistep-radius) var(--multistep-radius);
  padding: 2em;
}

.formkit-outer[data-type="multi-step"] [data-tab-style="progress"] .formkit-steps {
  border: 1px solid var(--multistep-color-border);
  border-radius: var(--multistep-radius);
  box-shadow: var(--multistep-shadow);
}

.formkit-outer[data-type="multi-step"] .formkit-step-actions {
  margin-bottom: -1em;
}

.formkit-step-actions {
  display: flex;
  justify-content: space-between;
}
.formkit-step-actions .formkit-step-next {
  margin-left: auto;
}
</style>
