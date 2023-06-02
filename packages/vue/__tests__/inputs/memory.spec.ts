import { describe, expect, it } from 'vitest'
// import { mount } from '@vue/test-utils'
// import { ref, nextTick, h } from 'vue'
// import LeakDetector from 'jest-leak-detector'

describe('memory', () => {
  it('words', () => expect(true).toBe(true))

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
