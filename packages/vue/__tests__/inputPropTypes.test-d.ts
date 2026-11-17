import { describe, it, assertType } from 'vitest'
import type { FormKitInputs } from '@formkit/inputs'
import FormKit from '../src/FormKit'

declare module '@formkit/inputs' {
  interface FormKitInputProps<Props extends FormKitInputs<Props>> {
    fakelist: { type: 'fakelist'; options: string[]; value?: string }
    fakedate: {
      type: 'fakedate'
      disabledDays?: (d: Date) => boolean
      value?: string
    }
  }
}

describe('known input types check their own props (#1818)', () => {
  it('rejects a wrong prop type', () => {
    // @ts-expect-error - disabledDays must be a function
    assertType(FormKit({ type: 'fakedate', disabledDays: 'yes' }))
    assertType(FormKit({ type: 'fakedate', disabledDays: () => true }))
  })
  it('rejects a wrong required prop type', () => {
    // @ts-expect-error - options must be strings
    assertType(FormKit({ type: 'fakelist', options: [1, 2] }))
  })
  it('does not (yet) require required props, so wrappers keep working', () => {
    assertType(FormKit({ type: 'fakelist' }))
    const attrs = {} as Record<string, unknown>
    assertType(FormKit({ type: 'fakelist', ...attrs }))
    const options = undefined as string[] | undefined
    assertType(FormKit({ type: 'fakelist', options }))
  })
})

describe('fallthrough stays permissive', () => {
  it('union types fall through', () => {
    const t = 'text' as 'text' | 'email'
    assertType(FormKit({ type: t, value: 'x' }))
  })
  it('no type is text', () => {
    assertType(FormKit({ value: 'x', label: 'hi' }))
  })
})

describe('event props receive the input value type (#1818)', () => {
  it('types onInput from the value', () => {
    assertType(
      FormKit({
        type: 'select',
        options: [{ label: 'A', value: 1 }],
        onInput: (value: number | undefined) => value,
      }),
    )
    assertType(
      FormKit({
        type: 'text',
        // @ts-expect-error - a text input never emits a Date
        onInput: (value: Date) => value,
      }),
    )
  })
})
