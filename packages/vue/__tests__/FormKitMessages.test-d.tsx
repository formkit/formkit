import { describe, it, assertType } from 'vitest'
import { defineComponent } from 'vue'
import { FormKitMessages } from '../src/FormKitMessages'

describe('FormKitMessages types', () => {
  it('allows section schema extensions to unset $el when using $cmp', () => {
    type Props = InstanceType<typeof FormKitMessages>['$props']

    assertType<Props>({
      library: {
        Notification: defineComponent({}),
      },
      sectionsSchema: {
        message: {
          $el: undefined,
          $cmp: 'Notification',
          props: {
            type: 'error',
          },
          children: '$message.value',
        },
      },
    })
  })
})
