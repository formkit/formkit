import { describe, it, assertType } from 'vitest'
import FormKit from '../src/FormKit'
import type { FormKitInputs } from '@formkit/inputs'

declare module '@formkit/inputs' {
  interface FormKitInputProps<Props extends FormKitInputs<Props>> {
    fakelist: { type: 'fakelist'; options: string[]; value?: string }
    fakemask: { type: 'fakemask'; mask: string; value?: string }
  }
}

describe('required props are enforced (#1818)', () => {
  it('fn form requires options', () => {
    // @ts-expect-error options required
    assertType(FormKit({ type: 'fakelist' }))
  })
  it('fn form requires mask', () => {
    // @ts-expect-error mask required
    assertType(FormKit({ type: 'fakemask' }))
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
  it('fakelist with options ok', () => {
    assertType(FormKit({ type: 'fakelist', options: ['a'] }))
  })
})
declare module '@formkit/inputs' {
  interface FormKitInputProps<Props extends FormKitInputs<Props>> {
    fakedate: {
      type: 'fakedate'
      disabledDays?: (d: Date) => boolean
      value?: string
    }
  }
}
describe('optional prop types are enforced (#1818)', () => {
  it('rejects wrong optional prop type', () => {
    // @ts-expect-error disabledDays must be fn
    assertType(FormKit({ type: 'fakedate', disabledDays: 'yes' }))
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
