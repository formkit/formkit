import { mount } from '@vue/test-utils'
import { FormKit, plugin, defaultConfig, resetCount } from '@formkit/vue'
import { createAutoHeightTextareaPlugin } from '../src/plugins/autoHeightTextarea'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('autoHeightTextarea', () => {
  let offsetWidthDescriptor: PropertyDescriptor | undefined
  let scrollHeightDescriptor: PropertyDescriptor | undefined

  beforeEach(() => {
    resetCount()
    offsetWidthDescriptor = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      'offsetWidth'
    )
    scrollHeightDescriptor = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      'scrollHeight'
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
    document.body.innerHTML = ''
    if (offsetWidthDescriptor) {
      Object.defineProperty(
        HTMLTextAreaElement.prototype,
        'offsetWidth',
        offsetWidthDescriptor
      )
    } else {
      delete (HTMLTextAreaElement.prototype as { offsetWidth?: number })
        .offsetWidth
    }
    if (scrollHeightDescriptor) {
      Object.defineProperty(
        HTMLTextAreaElement.prototype,
        'scrollHeight',
        scrollHeightDescriptor
      )
    } else {
      delete (HTMLTextAreaElement.prototype as { scrollHeight?: number })
        .scrollHeight
    }
  })

  it('recalculates height when a hidden textarea becomes visible (#1164)', async () => {
    vi.useFakeTimers()
    const textareaWidths = new WeakMap<HTMLTextAreaElement, number>()
    let resizeCallback: ResizeObserverCallback | undefined

    Object.defineProperty(HTMLTextAreaElement.prototype, 'offsetWidth', {
      configurable: true,
      get() {
        return textareaWidths.get(this) ?? 0
      },
    })
    Object.defineProperty(HTMLTextAreaElement.prototype, 'scrollHeight', {
      configurable: true,
      get() {
        const width = Number.parseInt(this.style.width, 10) || 0
        return width > 0 ? 64 : 20
      },
    })

    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          resizeCallback = callback
        }
        observe = vi.fn()
        unobserve = vi.fn()
        disconnect = vi.fn()
      }
    )
    vi.stubGlobal(
      'getComputedStyle',
      vi.fn(
        () =>
          ({
            boxSizing: 'border-box',
            maxHeight: 'none',
            minHeight: '0px',
            paddingBottom: '0px',
            paddingTop: '0px',
          }) as CSSStyleDeclaration
      )
    )

    const wrapper = mount(
      {
        data: () => ({
          isVisible: false,
          value: 'Line one\nLine two\nLine three',
        }),
        template: `
          <section v-show="isVisible">
            <FormKit type="textarea" auto-height v-model="value" />
          </section>
          <button @click="isVisible = true">Show</button>
        `,
      },
      {
        attachTo: document.body,
        global: {
          plugins: [
            [
              plugin,
              defaultConfig({
                plugins: [createAutoHeightTextareaPlugin()],
              }),
            ],
          ],
        },
      }
    )
    const textarea = wrapper.find('textarea').element as HTMLTextAreaElement
    textareaWidths.set(textarea, 0)

    await vi.advanceTimersByTimeAsync(10)
    expect(textarea.style.minHeight).toBe('20px')

    textareaWidths.set(textarea, 240)
    await wrapper.find('button').trigger('click')
    resizeCallback?.([], {} as ResizeObserver)
    await vi.advanceTimersByTimeAsync(10)

    expect(textarea.style.minHeight).toBe('64px')
    wrapper.unmount()
  })
})
