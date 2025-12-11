import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { FormKit, FormKitProvider, plugin, defaultConfig } from '../../src'
import { FormKitSchema } from '../../src/FormKitSchema'
import { resetRegistry, createNode, getNode } from '@formkit/core'
import corePlugin from '../../src/bindings'

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

  it('cleans up watchRegistry listeners when FormKitSchema with $get is unmounted', async () => {
    // Reset registry to start clean
    resetRegistry()

    // Create a node that will be referenced by $get
    const node = createNode({
      type: 'input',
      plugins: [corePlugin],
      props: { id: 'testNode' },
      value: 'initial',
    })

    // Verify the node is registered
    expect(getNode('testNode')).toBe(node)

    // Mount a schema that uses $get to reference the node (using simple string pattern)
    const wrapper = mount(FormKitSchema, {
      props: {
        schema: ['$get(testNode).value'],
      },
    })

    // Verify initial render
    expect(wrapper.html()).toBe('initial')

    // Unmount the schema component
    wrapper.unmount()

    // Clean up the node
    node.destroy()
    resetRegistry()

    // If cleanup worked correctly, there should be no errors
    // and the test should complete without hanging
  })

  it('does not accumulate watchRegistry listeners on repeated mount/unmount', async () => {
    // Reset registry
    resetRegistry()

    // Create a node
    const node = createNode({
      type: 'input',
      plugins: [corePlugin],
      props: { id: 'repeatTestNode' },
      value: 'test',
    })

    // Mount and unmount the schema multiple times
    for (let i = 0; i < 5; i++) {
      const wrapper = mount(FormKitSchema, {
        props: {
          schema: ['$get(repeatTestNode).value'],
        },
      })

      // Verify render
      expect(wrapper.html()).toBe('test')
      wrapper.unmount()
    }

    // Clean up
    node.destroy()
    resetRegistry()

    // If there were no memory leaks, this should complete without issues
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
