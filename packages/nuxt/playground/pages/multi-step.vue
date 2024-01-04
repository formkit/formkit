<script setup>
import { reactive, ref } from 'vue'
import { FormKitSchema } from '@formkit/vue'

const sections = ['Section 1', 'Section 2', 'Section 3']

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
        if: '$showStepTwo',
        name: 'stepTwo',
        children: [
          {
            $formkit: 'text',
            label: 'favorie color',
            validation: 'required',
          },
        ],
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
        ],
      },
    ],
  },
]

const schemaWithConditional = [
  {
    $formkit: 'multi-step',
    'tab-style': 'progress',
    'valid-step-icon': 'check',
    'allow-incomplete': true,
    children: [
      {
        $formkit: 'step',
        name: 'contact',
        children: [
          {
            $formkit: 'text',
            id: 'last_name',
            name: 'last_name',
            label: 'Last name',
            validation: 'required',
            help: 'set me to "test" to show address step.',
          },
          {
            $formkit: 'text',
            name: 'first_name',
            label: 'First name',
            validation: 'required',
          },
        ],
      },
      {
        $formkit: 'step',
        name: 'address',
        if: "$get(last_name).value == 'test'",
        children: [
          {
            $formkit: 'text',
            name: 'address',
            label: 'Adresse',
          },
          {
            $formkit: 'text',
            name: 'postal_code',
            label: 'Code postal',
          },
          {
            $formkit: 'text',
            name: 'city',
            label: 'Ville',
          },
        ],
        // use sectionsSchema to override default markup in schema.
        sectionsSchema: {
          stepNext: {
            if: 'true', // forcibly enable to override default schema conditonal.
            children: [
              {
                $formkit: 'submit',
              },
            ],
          },
        },
      },
    ],
  },
]

async function log(statement) {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  console.log(statement)
}

const schemaData = reactive({
  showStepTwo: true,
  log,
})

const multiStepNode = ref(null)
</script>

<template>
  <FormKitSchema :schema="multiStepFormSchema" :data="schemaData" />

  <FormKitSchema :schema="schemaWithConditional" />

  <!-- v-for on `step` -->
  {{ sections }}
  <FormKit type="multi-step">
    <FormKit
      v-for="section in sections"
      :key="section"
      type="step"
      :name="section"
    >
      Step content for {{ section }}
    </FormKit>
  </FormKit>

  <FormKit v-slot="{ value }" type="form">
    <!-- should not render as it is not inside a multi-step -->
    <FormKit type="step" />

    <FormKit
      type="multi-step"
      tab-style="progress"
      valid-step-icon="star"
      @node="(node) => (multiStepNode = node)"
    >
      <FormKit
        type="step"
        name="personalInfo"
        label="1. Info"
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
        v-if="schemaData.showStepTwo"
        type="step"
        label="2. References"
        name="references"
        :before-step-change="
          ({ currentStep, targetStep, delta }) => {
            if (delta > 0) {
              if (currentStep.value.supply === '1') {
                log('stops next')
                return false
              }
            }
          }
        "
      >
        <FormKit
          type="textarea"
          name="supply"
          label="Please supply 2 references"
          validation="required"
        />

        <template #stepNext="{ handlers }">
          <div class="custom-next" @click="handlers.next">
            My Custom Step Next
          </div>
        </template>
        <template #stepPrevious="{ handlers }">
          <div class="custom-next" @click="handlers.previous">
            My Custom Step Previous
          </div>
        </template>
      </FormKit>

      <FormKit
        type="step"
        name="Supplemental"
        label="3. Supplemental"
        previous-label="Go back"
        :previous-attrs="{
          'data-something': 'some data',
        }"
      >
        <FormKit
          type="text"
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
          <div class="ml-auto">
            <FormKit type="submit" />
          </div>
        </template>
      </FormKit>
    </FormKit>

    <FormKit type="button" @click="multiStepNode.next()">
      External Next Step Control</FormKit
    ><br />
    <FormKit type="button" @click="multiStepNode.previous()">
      External Previous Step Control</FormKit
    ><br />
    <FormKit type="button" @click="multiStepNode.goTo(2)">
      Go to step 3 by index</FormKit
    ><br />
    <FormKit type="button" @click="multiStepNode.goTo('Supplemental')">
      Go to step 3 by name</FormKit
    ><br />

    <FormKit
      type="button"
      @click="schemaData.showStepTwo = !schemaData.showStepTwo"
    >
      {{ schemaData.showStepTwo ? 'Hide' : 'Show' }} Step Two
    </FormKit>

    <pre>{{ value }}</pre>
  </FormKit>
</template>

<style scoped>
.custom-next {
  padding: 1em;
  background: #000;
  color: #fff;
  cursor: pointer;
  user-select: none;
}
</style>
