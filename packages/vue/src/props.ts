import { FormKitOptionsList } from '@formkit/inputs'
import {
  FormKitNode,
  FormKitPlugin,
  FormKitClasses,
  FormKitSchemaNode,
  FormKitSchemaCondition,
  FormKitTypeDefinition,
} from '@formkit/core'
import { PropType } from 'vue'

/**
 * Synthetic props are props that are not explicitly declared as props, but
 * should be treated as props to the outside world.
 */
type FormKitSyntheticProps = {
  accept: {
    type: PropType<string | undefined>
  }
  actions: {
    type: PropType<boolean | undefined>
  }
  action: {
    type: PropType<string>
  }
  label: {
    type: PropType<string | undefined>
  }
  method: {
    type: PropType<string>
  }
  enctype: {
    type: PropType<string>
  }
  options: {
    type: PropType<
      | string[]
      | number[]
      | FormKitOptionsList
      | Record<string | number, string>
      | undefined
    >
  }
  help: {
    type: PropType<string | undefined>
  }
  min: {
    type: PropType<string | number | undefined>
  }
  max: {
    type: PropType<string | number | undefined>
  }
  step: {
    type: PropType<string | number | undefined>
  }
  multiple: {
    type: PropType<string | boolean | undefined>
  }
  disabled: {
    type: PropType<string | boolean | undefined>
  }
  preserve: {
    type: PropType<string | boolean | undefined>
  }
}

/**
 * All the explicit FormKit props.
 */
const nativeProps = {
  config: {
    type: Object as PropType<Record<string, any>>,
    default: {},
  },
  classes: {
    type: Object as PropType<
      Record<string, string | Record<string, boolean> | FormKitClasses>
    >,
    required: false,
  },
  delay: {
    type: Number,
    required: false,
  },
  errors: {
    type: Array as PropType<string[]>,
    default: [],
  },
  inputErrors: {
    type: Object as PropType<Record<string, string[]>>,
    default: () => ({}),
  },
  id: {
    type: String,
    required: false,
  },
  modelValue: {
    required: false,
  },
  name: {
    type: String,
    required: false,
  },
  plugins: {
    type: Array as PropType<FormKitPlugin[]>,
    default: [],
  },
  sectionsSchema: {
    type: Object as PropType<
      Record<string, Partial<FormKitSchemaNode> | FormKitSchemaCondition>
    >,
    default: {},
  },
  type: {
    type: [String, Object] as PropType<string | FormKitTypeDefinition>,
    default: 'text',
  },
  validation: {
    type: [String, Array] as PropType<
      string | Array<[rule: string, ...args: any]>
    >,
    required: false,
  },
  validationMessages: {
    type: Object as PropType<
      Record<
        string,
        | string
        | ((ctx: { node: FormKitNode; name: string; args: any[] }) => string)
      >
    >,
    required: false,
  },
  validationRules: {
    type: Object as PropType<
      Record<string, (node: FormKitNode) => boolean | Promise<boolean>>
    >,
    required: false,
  },
  validationLabel: {
    type: [String, Function] as PropType<
      string | ((node: FormKitNode) => string)
    >,
    required: false,
  },
  ignore: {
    type: [String, Boolean],
    default: false,
  },
}

/**
 * The FormKit props merged with synthetics.
 * @internal
 */
export type FormKitProps = typeof nativeProps & FormKitSyntheticProps

/**
 * The FormKit props object.
 * @internal
 */
export const props = nativeProps as FormKitProps
