<script setup>
import { FormKitSchema } from '@formkit/vue'

const multiStepFormSchema = [
{
    $formkit: 'multi-step',
    beforeStepChange: '$log',
    allowIncomplete: false,
    children: [
      {
        $formkit: 'step',
        name: 'stepOne',
        children: [
          {
            $formkit: 'text',
            label: 'name',
            validation: 'required',
          },
        ],
      },
      {
        $formkit: 'step',
        name: 'stepTwo',
        children: [
          {
            $formkit: 'text',
            label: 'favorie color',
            validation: 'required',
          },
        ]
      },
      {
        $formkit: 'step',
        name: 'stepThree',
        children: [
          {
            $formkit: 'text',
            label: 'favorite memory',
            validation: 'required',
          },
        ]
      },
    ],
  },
]

const log = console.log

const data = { log }
</script>

<template>
  <FormKitSchema
    :schema="multiStepFormSchema"
    :data="data"
  />

  <FormKit
    v-slot="{ value }"
    type="form"
  >
    <FormKit type="step" />

    <FormKit
      type="multi-step"
      tab-style="progress"
      valid-step-icon="star"
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
        :before-step-change="({ currentStep, targetStep, delta }) => {
          if (delta > 0) {
            if (currentStep.value.supply === '1') {
              log('stops next')
              return false
            }
          }
        }"
        :prev-attrs="{
          label: 'hey there',
          'data-something': 'some data'
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
        label="A custom label"
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
