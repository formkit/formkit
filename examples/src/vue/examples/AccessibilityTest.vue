<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref } from 'vue'
import { reset, submitForm, FormKitNode } from '@formkit/core'

const submitError = ref(false)
const submitted = ref(false)
const success = ref(false)
const failure = ref(false)

const setWidth = (node: FormKitNode) => {
  node.input(window.innerWidth)
}

const axios = {
  post: (_data: any) => new Promise((r) => setTimeout(r, 2000)),
}

async function submitApplication(
  formData: Record<string, any>,
  formNode: FormKitNode
) {
  if (submitted.value) {
    resetState()
  }

  await axios.post(formData)
  submitted.value = true

  if (submitError.value === true) {
    formNode.setErrors(
      [
        'There were issues with your application. Please fix questions with errors and re-submit.',
      ],
      {
        why_apply: 'This looks like plagiarism. Please try again.',
      }
    )

    failure.value = true
    success.value = false
  } else {
    success.value = true
    failure.value = false
    alert(
      'Thank you for applying to FormKit University! We will evaluate all applications and respond by June 1, 2022.'
    )
    reset('fk-univ-app')
  }
}

const submitWithErrors = () => {
  submitError.value = true
  submitForm('fk-univ-app')
}

const resetState = () => {
  submitError.value = false
  submitted.value = false
  success.value = false
  failure.value = false
}

/**
---- Not yet used
- ✅ Button
- ✅ Checkbox
- ✅ Color
- ✅ Date
- ✅ Datetime
- ✅ Email
- ✅ File
- ✅ Group
- ✅ Hidden
- ✅ List
- ✅ Month
- ✅ Number
- ✅ Password
- ✅ Radio
- ✅ Range
- ✅ Search
- ✅ Select
- ✅ Select (multiple)
- ✅ Submit
- ✅ Telephone
- ✅ Text
- ✅ Textarea
- ✅ Time
- ✅ URL
- ✅ Week



---- Features
- Error states
- Form submission
- ✅ Conditional fields
- ✅ Slots

 */
</script>

<template>
  <main class="sample-form">
    <div v-if="success" class="success">Submitted successfully!</div>
    <div v-if="failure" class="failure">
      There were errors with your submission.
    </div>
    <h1>Apply to FormKit University</h1>
    <p>
      This is a fictional application for the purposes of accessibility testing.
      It includes at least 1 of each input within the FormKit input library with
      the default Genesis theme.
    </p>
    <FormKit
      id="fk-univ-app"
      v-slot="{ value: formData }"
      type="form"
      form-class="fk-univ-app"
      submit-label="Submit application"
      incomplete-message="Sorry. The application was not submitted because not all fields are filled out correctly."
      @submit="submitApplication"
    >
      <h2>Personal Information</h2>
      <FormKit name="contact_info" type="group">
        <FormKit
          name="first_name"
          label="*First name"
          type="text"
          validation="required"
          help="Enter your first name only."
          outer-class="side-by-side"
        />
        <FormKit
          name="last_name"
          label="*Last name"
          type="text"
          validation="required"
          help="Enter your last name only."
          outer-class="side-by-side"
        />
        <FormKit
          name="date_of_birth"
          type="date"
          label="*Date of birth"
          help="Enter your birthday."
          validation="required|date_between:1990-01-01:00:01:00,1999-12-31:23:59:59"
          :validation-messages="{
            date_between: 'Only 90s kids please.',
          }"
        />
        <FormKit
          name="email"
          type="email"
          label="*Email address"
          validation="required|email"
          placeholder="example@example.com"
        />
        <FormKit
          name="tel"
          type="tel"
          label="*Telephone number"
          validation="required|matches:/^[0-9]{3}-[0-9]{3}-[0-9]{4}$/"
          :validation-messages="{
            matches: 'Phone number must be in the format xxx-xxx-xxxx',
          }"
          placeholder="xxx-xxx-xxxx"
        />
        <FormKit
          name="website"
          type="url"
          label="Personal website URL"
          validation="url"
          placeholder="https://www.johndoe.com"
        />
        <FormKit
          name="favorite_color"
          type="color"
          value="#0062cc"
          label="Favorite color"
          outer-class="triple"
          help="What color gets you jazzed?"
        />
        <FormKit
          name="favorite_month"
          type="select"
          placeholder="Select a month"
          label="Favorite month"
          value="August"
          outer-class="triple"
          help="Choose your favorite month."
          validation="is:June,July,August,September"
          :validation-messages="{
            is: 'Only Summer months allowed.',
          }"
          validation-visibility="dirty"
          :options="[
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
          ]"
        />
        <FormKit
          name="favorite_number"
          type="number"
          value="10"
          label="Favorite number"
          outer-class="triple"
          help="What are your favorite digits?"
        />

        <h3>Emergency contacts</h3>
        <FormKit type="list" name="emergency_contacts">
          <FormKit type="group" name="emergency_contact_1">
            <FormKit
              name="emergency_1_name"
              label="*Emergency contact 1: Full name"
              type="text"
              validation="required"
              outer-class="side-by-side"
            />
            <FormKit
              name="emergency_1_email"
              label="*Emergency contact 1: Email address"
              type="email"
              validation="required"
              outer-class="side-by-side"
            />
          </FormKit>

          <FormKit type="group" name="emergency_contact_2">
            <FormKit
              name="emergency_2_name"
              label="Emergency contact 2: Full name"
              type="text"
              outer-class="side-by-side"
            />
            <FormKit
              name="emergency_2_email"
              label="Emergency contact 2: Email address"
              type="email"
              outer-class="side-by-side"
            />
          </FormKit>
        </FormKit>
      </FormKit>

      <h2>Application</h2>

      <FormKit
        name="why_apply"
        type="textarea"
        label="*Why do you want to attend FormKit University?"
        help="Serious applicants only."
        validation="required|length:300,1000"
        validation-label="Your answer"
        validation-visibility="blur"
        rows="6"
      >
        <template #help="context">
          <div :class="[context.classes.help]">
            {{ context.help }} <br />
            <span
              >{{ 1000 - (context._value ? context._value.length : 0) }} / 1000
              characters remaining.</span
            >
          </div>
        </template>
      </FormKit>

      <FormKit
        type="file"
        label="Your résumé"
        accept=".pdf,.doc,.md,.jpg,.jpeg,.png"
        help="Upload your résumé if you have one."
        multiple
      />

      <FormKit
        name="interests"
        label="What are your areas of interest?"
        type="checkbox"
        :options="[
          'Accessibility',
          'Form error handling',
          'Form generation from schema',
          'Form styles and theming',
          'Validation',
          'Internationalization',
        ]"
      />

      <FormKit
        name="hear_about"
        label="How did you hear about FormKit University?"
        type="radio"
        value="A lot"
        :options="[
          'A friend',
          'The radio',
          'TV commercial',
          'Thoughts on Forms podcast',
          'Google search',
          'Other',
        ]"
      />
      <FormKit
        v-if="formData?.hear_about == 'Other'"
        name="hear_about_other"
        label="Other way you heard about FormKit University:"
        type="text"
      />

      <FormKit
        type="select"
        multiple
        label="What free merch would you like to receive?"
        name="merch"
        :options="[
          { label: 'T-shirt', value: 'shirt' },
          { label: 'Hat', value: 'hat' },
          { label: 'Beanie', value: 'beanie' },
          { label: 'Mug', value: 'mug' },
        ]"
        help="Select all the free merch you'd like to receive by holding command (macOS) or control (PC)."
      />

      <FormKit
        v-if="
          Array.isArray(formData?.merch) && formData?.merch.includes('shirt')
        "
        name="t_shirt"
        type="select"
        placeholder="Select a shirt size"
        label="T-shirt size"
        :options="['Small', 'Medium', 'Large']"
      />

      <FormKit
        name="years_experience"
        label="Years of experience"
        help="How many years of experience building forms do you have?"
        type="range"
        value="5"
        min="0"
        max="10"
        outer-class="side-by-side"
      />

      <div class="side-by-side years-output">
        <strong>{{ formData?.years_experience || 0 }} years.</strong>
      </div>

      <h2>Next steps</h2>

      <FormKit
        name="zoom_meeting"
        type="datetime-local"
        label="*Date and time of Zoom interview"
        help="Schedule a date (mm/dd/yyyy) and time in June 2022 and we'll send you a calendar invite."
        validation="required|date_between:2022-06-01:00:01:00,2022-06-30:23:59:00"
        validation-label="The interview"
        min="2022-06-01T00:00"
        max="2022-06-30T23:59"
      />

      <FormKit
        name="zoom_backup"
        type="time"
        label="*Backup time for Zoom interview"
        help="Select a backup time of day for the Zoom interview."
        validation="required"
      />

      <FormKit
        type="week"
        name="tour_week"
        label="Tour week"
        help="If accepted, choose which week you'd like to tour the campus."
        min="2022-W20"
        max="2022-W28"
      />

      <FormKit
        type="month"
        name="tuition_start"
        label="Tuition start month"
        help="If accepted, choose which month you'd like your tuition cycle to begin."
        min="2022-08"
        max="2022-10"
      />

      <FormKit
        name="access_pin"
        label="*Access Pin"
        help="Set your numeric Access Pin to retrieve your application data later."
        type="password"
        validation="required|length:16|matches:/^\d+$/"
        :validation-messages="{
          matches: 'Access Pin can only contain numbers.',
        }"
        outer-class="side-by-side"
      />

      <FormKit
        type="password"
        name="access_pin_confirm"
        label="*Confirm Access Pin"
        help="Must match the Access Pin exactly as entered in the last step."
        validation="required|confirm"
        validation-label="Access Pin confirmation"
        outer-class="side-by-side"
      />

      <FormKit name="window_width" type="hidden" @node="setWidth" />

      <FormKit
        type="button"
        name="submitWithErrors"
        label="Submit applications (with returned errors)"
        input-class="submit-with-errors"
        @click="submitWithErrors"
      />

      <div v-if="success" class="success">Submitted successfully!</div>
      <div v-if="failure" class="failure">
        There were errors with your submission.
      </div>
    </FormKit>
  </main>
</template>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 40px;
  margin-bottom: 60px;

  ::placeholder {
    font-size: 14px;
  }

  .formkit-outer {
    margin-bottom: 1.75em;

    &.last-in-group {
      margin-bottom: 3em;
    }
  }
  .formkit-wrapper,
  .formkit-fieldset {
    max-width: none;
  }

  .submit-with-errors {
    color: black;
    padding: 0;
    margin-bottom: 0.5em;
    text-decoration: underline;
    background-color: transparent;
  }
}

.success,
.failure {
  background-color: #8fed8f;
  padding: 12px 15px;
  color: black;
  font-weight: 700;
  flex: 0 1 100%;
  margin-bottom: 1.5em;
  border-radius: 6px;
}

.failure {
  background-color: #ff2d2d;
}

h1 {
  font-size: 2.25em;
  line-height: 1.2;
}

h2 {
  font-size: 1.75em;
}

h2,
h3 {
  width: 100%;
}

p {
  line-height: 1.5;
}

input {
  width: 100%;
}

.container {
  margin: 0 auto;
  width: 90%;
  max-width: 600px;

  @media (min-width: 800px) {
    width: 80%;
  }
}

.global-search {
  display: flex;
  width: 100%;

  .search-input {
    flex: 0 1 calc(100% - 115px);
  }

  .formkit-actions {
    margin-left: 15px;
    flex: 0 0 100px;

    .search-submit .formkit-input {
      width: 100%;
      padding-left: 20px;
      padding-right: 20px;
    }
  }
}

.fk-univ-app {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;

  .formkit-actions {
    flex: 0 0 100%;
  }
}

.formkit-outer {
  width: 100%;
}

.side-by-side {
  flex: 0 0 100%;

  @media (min-width: 800px) {
    flex: 0 0 calc(50% - 20px);
  }
}

.triple {
  flex: 0 0 100%;

  @media (min-width: 800px) {
    flex: 0 0 calc(33.33% - 20px);
  }
}

pre.range-output {
  background: #eee;
  border-radius: 0.5em;
  text-align: center;
  margin-left: 1em;
  margin-top: 1.5em;
  font-weight: bold;
  padding: 0.5em;
  line-height: 1;
  width: 1.5em;
}

pre.form-data {
  box-sizing: border-box;
  background: #eee;
  border: 1px solid #ccc;
  width: 100%;
  padding: 1em;
  border-radius: 0.5em;
}
</style>
