import { describe, it, expectTypeOf } from 'vitest'
import type {
  FormKitBaseSlots,
  FormKitInputs,
  FormKitSlotData,
} from '@formkit/inputs'
import FormKit from '../src/FormKit'

declare module '@formkit/inputs' {
  interface FormKitInputProps<Props extends FormKitInputs<Props>> {
    'test-text': { type: 'test-text'; value?: string }
  }
  interface FormKitInputSlots<Props extends FormKitInputs<Props>> {
    'test-text': FormKitBaseSlots<Props> & {
      slotName: FormKitSlotData<Props, { fooBar: string }>
    }
  }
}

describe('custom input slot types (#931)', () => {
  it('exposes augmented slot props for custom input types', () => {
    type Slots = NonNullable<
      ReturnType<typeof FormKit<{ type: 'test-text' }>>['__ctx']
    >['slots']
    type SlotProps = Parameters<NonNullable<Slots['slotName']>>[0]
    expectTypeOf<SlotProps['fooBar']>().toEqualTypeOf<string>()
    expectTypeOf<SlotProps['value']>().toEqualTypeOf<string | undefined>()
  })
})
