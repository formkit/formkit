<script setup lang="ts">
import type { FormKitNode } from '@formkit/core'
import { ref } from 'vue'

const showSimple = ref(false)

const groups: { value: number; label: string }[] = []
for (let i = 0; i < 18; i++) {
  groups.push({
    value: i,
    label: `Group ${i}`,
  })
}

const protocols = [
  { value: 'tcp', label: 'TCP' },
  { value: 'udp', label: 'UDP' },
]

const destinations: { value: number; label: string }[] = []
for (let i = 0; i < 43; i++) {
  destinations.push({
    value: i,
    label: `Destination ${i}`,
  })
}

const services: {
  id: number
  description: string
  srcGroup: number
  destination: number
  dstPort: number
  protocol: string
}[] = []
for (let i = 0; i < 91; i++) {
  services.push({
    id: i,
    description: `Rule ${i}`,
    srcGroup: groups[i % groups.length].value,
    destination: destinations[i % destinations.length].value,
    dstPort: 8000 + i,
    protocol: protocols[i % protocols.length].value,
  })
}

const renderFormKit = ref(false)
const renderNative = ref(false)

const onInput = (node: FormKitNode) => {
  node.on('input', () =>
    console.log(`node.input (${node.name}, value: ${node._value})`)
  )
}
</script>

<template>
  <h1>Performance</h1>
  <div class="flex space-x-5 m-9">
    <span>
      Render FormKit takes too long
      <FormKit type="button" @click="renderFormKit = !renderFormKit"
        >{{ renderFormKit ? 'Hide' : 'Render' }} FormKit</FormKit
      >
    </span>
    <span>
      Render Native is fast
      <FormKit type="button" @click="renderNative = !renderNative"
        >{{ renderNative ? 'Hide' : 'Render' }} native</FormKit
      >
    </span>
  </div>
  <FormKit v-if="renderFormKit" type="form">
    <template v-for="service in services" :key="service.id">
      <div
        class="flex flex-row my-2 space-x-2 justify-between items-center bg-white dark:bg-dark-900 p-4 shadow-sm rounded-md"
      >
        <FormKit type="group">
          <div class="flex flex-col lg:flex-row lg:space-x-2 w-full">
            <div class="flex w-full space-x-2">
              <div class="w-full">
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-dark-300"
                  >Description</label
                >
                <FormKit
                  v-model="service.description"
                  type="text"
                  placeholder="Description"
                  class="w-full"
                />
              </div>
              <div class="w-full">
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-dark-300"
                  >Source group</label
                >
                <FormKit
                  v-model="service.srcGroup"
                  type="select"
                  placeholder="Select a group"
                  class="w-full style-select"
                  :options="groups"
                  validation="required"
                  :validation-messages="{
                    required: 'Required',
                  }"
                />
              </div>
              <div class="w-full lg:w-1/2">
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-dark-300 min-w-max"
                  >Destination port</label
                >
                <FormKit
                  v-model="service.dstPort"
                  type="number"
                  placeholder="8080"
                  validation="required|number|min:1|max:65535"
                  :validation-messages="{
                    required: 'Required',
                    number: 'Must be a number',
                    min: 'Must be at least 1',
                    max: 'Must be at most 65535',
                  }"
                />
              </div>
            </div>
            <div class="flex w-full space-x-2">
              <div class="w-full">
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-dark-300"
                  >Destination</label
                >
                <FormKit
                  v-model="service.destination"
                  type="select"
                  :placeholder="
                    destinations
                      ? 'Select a destination'
                      : 'No destinations available'
                  "
                  class="w-full style-select"
                  :disabled="!destinations.length"
                  :options="destinations"
                  validation="required"
                  :validation-messages="{
                    required: 'Required',
                  }"
                />
              </div>
              <div class="w-full lg:w-1/2">
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-dark-300"
                  >Protocol</label
                >
                <FormKit
                  v-model="service.protocol"
                  type="select"
                  placeholder="Select a protocol"
                  class="w-full style-select"
                  :options="protocols"
                  validation="required"
                  :validation-messages="{
                    required: 'Required',
                  }"
                />
              </div>
            </div>
          </div>
        </FormKit>
      </div>
    </template>
  </FormKit>

  <div v-if="renderNative" type="form">
    <template v-for="service in services" :key="service.id">
      <div
        class="flex flex-row my-2 space-x-2 justify-between items-center bg-white dark:bg-dark-900 p-4 shadow-sm rounded-md"
      >
        <div class="flex flex-col lg:flex-row lg:space-x-2 w-full">
          <div class="flex w-full space-x-2">
            <div class="w-full">
              <label
                class="block text-sm font-medium text-gray-700 dark:text-dark-300"
                >Description</label
              >
              <input
                v-model="service.description"
                type="text"
                placeholder="Description"
                class="w-full"
              />
            </div>
            <div class="w-full">
              <label
                class="block text-sm font-medium text-gray-700 dark:text-dark-300"
                >Source group</label
              >
              <select
                v-model="service.srcGroup"
                placeholder="Select a group"
                class="w-full style-select"
              >
                <option
                  v-for="group in groups"
                  :key="group.value"
                  :value="group.value"
                >
                  {{ group.label }}
                </option>
              </select>
            </div>
            <div class="w-full lg:w-1/2">
              <label
                class="block text-sm font-medium text-gray-700 dark:text-dark-300 min-w-max"
                >Destination port</label
              >
              <input
                v-model="service.dstPort"
                type="number"
                placeholder="8080"
              />
            </div>
          </div>
          <div class="flex w-full space-x-2">
            <div class="w-full">
              <label
                class="block text-sm font-medium text-gray-700 dark:text-dark-300"
                >Destination</label
              >
              <select
                v-model="service.destination"
                class="w-full style-select"
                :disabled="!destinations.length"
              >
                <option
                  v-for="destination in destinations"
                  :key="destination.value"
                  :value="destination.value"
                >
                  {{ destination.label }}
                </option>
              </select>
            </div>
            <div class="w-full lg:w-1/2">
              <label
                class="block text-sm font-medium text-gray-700 dark:text-dark-300"
                >Protocol</label
              >
              <select
                v-model="service.protocol"
                placeholder="Select a protocol"
                class="w-full style-select"
              >
                <option
                  v-for="protocol in protocols"
                  :key="protocol.value"
                  :value="protocol.value"
                >
                  {{ protocol.label }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>

  <button @click="() => (showSimple = !showSimple)">Simple test</button>
  <FormKit type="form" v-if="showSimple">
    <FormKit
      type="text"
      name="foo"
      label="foo"
      validation="required"
      @node="onInput"
    />
    <FormKit
      type="text"
      name="bar"
      label="bar"
      validation="required"
      @node="onInput"
    />
  </FormKit>
</template>
