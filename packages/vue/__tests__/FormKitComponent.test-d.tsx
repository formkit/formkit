import { describe, it, expectTypeOf } from 'vitest'
import type { FormKitComponent } from '../src'
import FormKit from '../src/FormKit'

/**
 * vue-tsc resolves a component's props/slots by checking for a construct
 * signature *before* a call signature. If the public FormKit type ever gains a
 * construct signature again (for example by intersecting it with
 * DefineComponent) every <FormKit> in an SFC silently loses its prop and slot
 * inference. See https://github.com/formkit/formkit/issues/1777
 */
describe('FormKitComponent public type', () => {
  it('is not constructable (keeps vue-tsc on the generic call signature)', () => {
    type IsConstructable<T> = T extends abstract new (...args: any) => any
      ? true
      : false
    expectTypeOf<IsConstructable<FormKitComponent>>().toEqualTypeOf<false>()
    expectTypeOf<IsConstructable<typeof FormKit>>().toEqualTypeOf<false>()
  })

  it('infers slot props from the input type', () => {
    // Slot types come from the `__ctx` member of the return type (that's what
    // vue-tsc reads); the context parameter is intentionally loose for h().
    type ListSlots = NonNullable<
      ReturnType<typeof FormKit<{ type: 'list'; value: object[] }>>['__ctx']
    >['slots']
    type DefaultSlotProps = Parameters<NonNullable<ListSlots['default']>>[0]
    expectTypeOf<DefaultSlotProps['items']>().not.toBeAny()
    expectTypeOf<DefaultSlotProps['value']>().not.toBeAny()
  })
})
