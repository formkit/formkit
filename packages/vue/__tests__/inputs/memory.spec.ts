import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { FormKit, FormKitProvider, plugin, defaultConfig } from '../../src'

describe('memory', () => {
  beforeEach(() => {
    // Clear the global configs array before each test
    ;(globalThis as any).__FORMKIT_CONFIGS__ = undefined
  })

  afterEach(() => {
    // Clean up after each test
    ;(globalThis as any).__FORMKIT_CONFIGS__ = undefined
  })

  it('cleans up __FORMKIT_CONFIGS__ when FormKitProvider is unmounted', async () => {
    // Verify we start clean
    expect(globalThis.__FORMKIT_CONFIGS__).toBeUndefined()

    const wrapper = mount({
      components: {
        FormKit,
        FormKitProvider,
      },
      methods: {
        defaultConfig,
      },
      template: `
        <FormKitProvider :config="defaultConfig">
          <FormKit type="text" name="foo" />
        </FormKitProvider>
      `,
    })

    // After mounting, there should be one config
    expect(globalThis.__FORMKIT_CONFIGS__).toBeDefined()
    expect(globalThis.__FORMKIT_CONFIGS__?.length).toBe(1)

    // Unmount the component
    wrapper.unmount()

    // After unmounting, the config should be removed
    expect(globalThis.__FORMKIT_CONFIGS__?.length).toBe(0)
  })

  it('cleans up __FORMKIT_CONFIGS__ when using plugin directly', async () => {
    // Verify we start clean
    expect(globalThis.__FORMKIT_CONFIGS__).toBeUndefined()

    const wrapper = mount(FormKit, {
      props: {
        type: 'text',
        name: 'test',
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })

    // After mounting, there should be one config
    expect(globalThis.__FORMKIT_CONFIGS__).toBeDefined()
    expect(globalThis.__FORMKIT_CONFIGS__?.length).toBe(1)

    // Unmount the component
    wrapper.unmount()

    // After unmounting, the config should be removed
    expect(globalThis.__FORMKIT_CONFIGS__?.length).toBe(0)
  })

  it('does not accumulate configs when mounting/unmounting multiple times', async () => {
    // Verify we start clean
    expect(globalThis.__FORMKIT_CONFIGS__).toBeUndefined()

    // Mount and unmount multiple times
    for (let i = 0; i < 5; i++) {
      const wrapper = mount({
        components: {
          FormKit,
          FormKitProvider,
        },
        methods: {
          defaultConfig,
        },
        template: `
          <FormKitProvider :config="defaultConfig">
            <FormKit type="text" name="foo" />
          </FormKitProvider>
        `,
      })

      // During mount, there should be exactly one config
      expect(globalThis.__FORMKIT_CONFIGS__?.length).toBe(1)

      wrapper.unmount()

      // After unmount, there should be zero configs
      expect(globalThis.__FORMKIT_CONFIGS__?.length).toBe(0)
    }
  })

  // it(
  //   'can garbage collect a plain list of DOM nodes (control test)',
  //   async () => {
  //     const items = ref<number[]>([])
  //     const wrapper: any = mount({
  //       components: {
  //         TestInput: () => h('div', [h('input')]),
  //       },
  //       setup() {
  //         return { items }
  //       },
  //       template: `
  //       <div>
  //         <TestInput
  //           v-for="i in items"
  //         />
  //       </div>
  //     `,
  //     })
  //     let detector: LeakDetector
  //     async function changeCount(add = true) {
  //       if (add && items.value.length < 100) {
  //         await new Promise<void>((resolve) =>
  //           setTimeout(() => (items.value.push(Math.random()), resolve()), 20)
  //         )
  //         if (items.value.length === 50) {
  //           await nextTick()
  //           detector = new LeakDetector(
  //             wrapper.findAll('input')[49].element as HTMLInputElement
  //           )
  //         }
  //         await changeCount()
  //       } else if (items.value.length) {
  //         await new Promise<void>((resolve) =>
  //           setTimeout(() => (items.value.pop(), resolve()), 20)
  //         )
  //         await changeCount(false)
  //       }
  //     }
  //     await changeCount()
  //     await new Promise((r) => setTimeout(r, 5000))
  //     expect(await detector!.isLeaking()).toBe(false)
  //   },
  //   { timeout: 10000 }
  // )
})
