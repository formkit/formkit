import { FormKitMiddleware, getNode, reset } from '@formkit/core'
import defaultConfig from '../src/defaultConfig'
import { plugin } from '../src/plugin'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'

describe('standard lists', () => {
  it('uses list index as key', () => {
    mount(
      {
        template: `
        <FormKit
          type="list"
          id="listA"
        >
          <FormKit value="foo" name="first" />
          <FormKit value="bar" name="second" />
          <FormKit value="baz" name="third" />
        </FormKit>
      `,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    expect(getNode('listA')!.value).toStrictEqual(['foo', 'bar', 'baz'])
  })

  it('can show a validation error without validation-label', () => {
    const wrapper = mount(
      {
        template: `
        <FormKit
          type="list"
          id="listA"
        >
          <FormKit name="first" />
          <FormKit name="second" validation="required" validation-visibility="live" />
          <FormKit name="third" />
        </FormKit>
      `,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    expect(wrapper.html()).toContain('>1 is required')
  })

  it('can reset a list of objects to their original state', async () => {
    const wrapper = mount(
      {
        data() {
          return {
            books: [
              {},
              { title: 'To Kill A Mockingbird', author: 'Harper Lee' },
            ],
          }
        },
        template: `
        <div>
          <FormKit type="list" v-model="books" id="books">
            <FormKit type="group">
              <FormKit name="title" value="A Farewell to Arms" />
              <FormKit name="author" />
            </FormKit>
            <FormKit type="group">
              <FormKit name="title" />
              <FormKit name="author" />
            </FormKit>
            <FormKit type="group">
              <FormKit name="title" />
              <FormKit name="author" />
            </FormKit>
          </FormKit>
        </div>
      `,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    const [titleA, authorA, titleB, authorB, titleC, authorC] = wrapper
      .get('div')
      .findAll('input')
    expect(titleA.element.value).toBe('A Farewell to Arms')
    expect(authorA.element.value).toBe('')
    expect(titleB.element.value).toBe('To Kill A Mockingbird')
    expect(authorB.element.value).toBe('Harper Lee')
    expect(titleC.element.value).toBe('')
    expect(authorC.element.value).toBe('')
    await nextTick()
    titleC.setValue('The Great Gatsby')
    authorC.setValue('F. Scott Fitzgerald')
    await new Promise((r) => setTimeout(r, 30))
    expect(wrapper.vm.books).toStrictEqual([
      { title: 'A Farewell to Arms', author: undefined },
      { title: 'To Kill A Mockingbird', author: 'Harper Lee' },
      { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' },
    ])
    reset('books')
    await nextTick()
    expect(titleA.element.value).toBe('A Farewell to Arms')
    expect(authorA.element.value).toBe('')
    expect(titleB.element.value).toBe('To Kill A Mockingbird')
    expect(authorB.element.value).toBe('Harper Lee')
    expect(titleC.element.value).toBe('')
    expect(authorC.element.value).toBe('')
    expect(getNode('books')!.value).toStrictEqual([
      { title: 'A Farewell to Arms', author: undefined },
      { title: 'To Kill A Mockingbird', author: 'Harper Lee' },
      { title: undefined, author: undefined },
    ])
  })

  it('can insert an input between other inputs', async () => {
    const wrapper = mount(
      {
        data() {
          return {
            showB: false,
            values: [],
          }
        },
        template: `<FormKit type="list" v-model="values">
        <FormKit value="A" />
        <FormKit value="B" v-if="showB" :index="1" />
        <FormKit value="C" />
      </FormKit>
      `,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )

    expect(wrapper.vm.values).toStrictEqual(['A', 'C'])
    wrapper.vm.showB = true
    await new Promise((r) => setTimeout(r, 25))
    expect(wrapper.vm.values).toStrictEqual(['A', 'B', 'C'])
  })

  it('can replace the value array', async () => {
    const middleware: FormKitMiddleware<any[]> = (value, next) => {
      return next(value.map((childValue: any) => childValue))
    }
    const warn = vi.spyOn(console, 'warn')
    const hookCallback = vi.fn(middleware)
    mount(
      {
        data() {
          return {
            values: ['foo'],
          }
        },
        template: `<FormKit type="list" v-model="values">
          <FormKit />
      </FormKit>
      `,
      },
      {
        global: {
          plugins: [
            [
              plugin,
              defaultConfig({
                plugins: [
                  function (node) {
                    if (node.type === 'list') {
                      node.hook.commit(hookCallback)
                    }
                  },
                ],
              }),
            ],
          ],
        },
      }
    )
    expect(hookCallback).toBeCalledTimes(4)
    await new Promise((r) => setTimeout(r, 50))
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  describe('synced lists', () => {
    it('can sync a list of strings to their underlying formkit nodes', async () => {
      const wrapper = mount(
        {
          data() {
            return {
              books: [
                'The Great Gatsby',
                'To Kill A Mockingbird',
                'A Farewell to Arms',
                'The Catcher in the Rye',
              ],
            }
          },
          template: `
          <FormKit type="list" :sync="true" v-model="books" id="books" #default="{ items }">
            <FormKit type="text" v-for="(item, index) in items" :key="item" :index="index" />
          </FormKit>
        `,
        },
        {
          global: {
            plugins: [[plugin, defaultConfig]],
          },
        }
      )
      expect(wrapper.findAll('input').length).toBe(4)
      wrapper.vm.books.splice(1, 1)
      await nextTick()
      expect(wrapper.findAll('input').length).toBe(3)
    })

    it('can do the hokey pokey and turn itself around', async () => {
      const wrapper = mount(
        {
          data() {
            return {
              books: [
                { book: 'The Great Gatsby' },
                { book: 'To Kill A Mockingbird' },
                { book: 'A Farewell to Arms' },
                { book: 'The Catcher in the Rye' },
              ],
            }
          },
          template: `
          <FormKit type="list" :sync="true" v-model="books" id="books" #default="{ items }">
            <FormKit type="group" v-for="(item, index) in items" :key="item" :index="index">
              <FormKit type="text" name="book" />
            </FormKit>
          </FormKit>
        `,
        },
        {
          global: {
            plugins: [[plugin, defaultConfig]],
          },
        }
      )
      let count = wrapper.vm.books.length
      async function cycle() {
        const book = wrapper.vm.books.splice(0, 1)
        await nextTick()
        expect(wrapper.findAll('input').length).toBe(3)
        wrapper.vm.books.push(book[0])
        await nextTick()
        if (--count > 0) {
          await cycle()
        }
      }
      await cycle()
    })
  })
})
