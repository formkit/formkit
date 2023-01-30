<template>
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
          label="Your Name"
          name="name"
          validation="required"
        />
      </FormKit>

      <FormKit
        key="secondStep"
        type="step"
        label="Details"
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
}

.formkit-outer[data-type="multi-step"] > .formkit-wrapper {
  max-width: 32em;
  box-shadow: 0.25em 0.25em 1em 0 rgb(0 0 0 / 10%);
  border-radius: 0.4em;
}

.formkit-outer[data-type="multi-step"] > .formkit-wrapper .formkit-wrapper {
  max-width: none;
}

.formkit-outer[data-type="multi-step"] .formkit-tabs {
  list-style-type: none;
  margin: 0;
  display: flex;
  padding-left: 0;
  background: var(--multistep-color-tab);
  overflow: auto;
  border-radius: 0.4em 0.4em 0 0;
  border: 1px solid var(--multistep-color-border);
}

.formkit-outer[data-type="multi-step"] .formkit-tab {
  appearance: none;
  font-size: 0.875rem;
  align-items: center;
  padding: 1rem 1.5rem;
  background: var(--multistep-color-tab);
  border: none;
  border-right: 1px solid var(--multistep-color-border);
  color: var(--multistep-color-tab-text);
  flex-grow: 1;
  flex-shrink: 1;
  max-width: 33.333%;
  position: relative;
  cursor: pointer;
  user-select: none;
  text-align: center;
}
.formkit-outer[data-type="multi-step"] .formkit-tab:last-child {
  margin-right: -1px;
}
.formkit-outer[data-type="multi-step"] .formkit-tab[data-active="true"] {
  background: var(--multistep-color-tab-active);
  color: var(--multistep-color-tab-active-text);
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
  line-height: 0;
  top: 0.25rem;
  right: 0.25rem;
  text-indent: -0.15em;
}
.formkit-outer[data-type="multi-step"] .formkit-tab[data-valid="true"] .formkit-badge {
  background: var(--multistep-color-success);
}
.formkit-outer[data-type="multi-step"] .formkit-badge .formkit-icon {
  width: 100%;
  height: 100%;
}

.formkit-outer[data-type="multi-step"] .formkit-steps {
  border: 1px solid var(--multistep-color-border);
  border-top: none;
  border-radius: 0 0 0.4em 0.4em;
  padding: 2em;
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
