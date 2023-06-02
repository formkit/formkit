import { FormKitBaseProps } from '@formkit/inputs'
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
type FormKitSyntheticVueProps = {
  [Property in keyof FormKitBaseProps]: {
    type: PropType<FormKitBaseProps[Property] | undefined>
  }
}

/**
 * All the explicit FormKit props.
 */
const runtimeProps = {
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
  dynamic: {
    type: Boolean as PropType<boolean | undefined>,
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
  index: {
    type: Number,
    required: false,
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
  parent: {
    type: Object as PropType<FormKitNode>,
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
  sync: {
    type: Boolean as PropType<boolean | undefined>,
    required: false,
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
}

/**
 * The FormKit props merged with synthetics.
 * @internal
 */
export type FormKitProps = typeof runtimeProps & FormKitSyntheticVueProps

/**
 * The FormKit props object.
 * @internal
 */
export const props = runtimeProps as FormKitProps
