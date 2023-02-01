<script setup>
import { FormKitSchema } from '@formkit/vue'

const multiStepFormSchema = [
{
    $formkit: 'multi-step',
    children: [
      {
        $formkit: 'step',
        name: 'stepOne',
        children: [
          {
            $formkit: 'text',
            validation: 'required',
          },
        ],
      },
      {
        $formkit: 'step',
        name: 'stepTwo',
      },
      {
        $formkit: 'step',
        name: 'stepThree',
      },
    ],
  },
]

const log = console.log
</script>

<template>
  <FormKitSchema :schema="multiStepFormSchema" />

  <FormKit
    v-slot="{ value }"
    type="form"
  >
    <FormKit type="step" />

    <FormKit
      type="multi-step"
      tab-style="progress"
      valid-step-icon="star"
      :before-next="log"
    >
      <FormKit
        type="step"
        name="personalInfo"
        valid-step-icon="bitcoin"
      >
        <FormKit
          type="text"
          label="My Name"
          prefix-icon="avatarMan"
          validation="required"
        />
        <FormKit
          type="tel"
          label="Phone"
          prefix-icon="telephone"
          validation="required"
        />
      </FormKit>
    
      <FormKit
        type="step"
        name="references"
        :before-next="(node) => {
          if (node.value.supply === '1') {
            log('stops next')
            return false
          }
        }"
      >
        <FormKit
          type="textarea"
          name="supply"
          label="Please supply 2 references"
          validation="required"
        />
      </FormKit>

      <FormKit
        type="step"
        name="Supplemental"
      >
        <FormKit
          type="textarea"
          label="Why do you want to work here?"
          validation="required"
        />
        <FormKit
          type="radio"
          label="How did you hear about us"
          validation="required"
          :options="[
            { label: 'Google', value: 'google' },
            { label: 'Facebook', value: 'facebook' },
            { label: 'Twitter', value: 'twitter' },
            { label: 'Friend', value: 'friend' },
          ]"
        />

        <template #stepNext>
          <FormKit type="submit" />
        </template>
      </FormKit>
    </FormKit>

    <pre>{{ value }}</pre>
  </FormKit>
</template>
