import { FormKitPlugin } from '@formkit/core'
import { FormKitSchemaCondition } from '@formkit/core'
import { FormKitTypeDefinition } from '@formkit/core'
import { FormKitSchemaNode } from '@formkit/core'
import { FormKitNode } from '@formkit/core'
import { FormKitClasses } from '@formkit/core'

/**
 * This is the base interface for providing prop definitions to the FormKit
 * component. It is used to define the props that are available to the each
 * component in the FormKit library by using a discriminated union type. The
 * structure of this interface is:
 *
 * ```ts
 * interface FormKitInputProps {
 *  typeString: { type: 'string'; value?: string } // <-- All unique props
 * }
 * ```
 *
 * All inputs will also inherit all props from FormKitBaseInputProps.
 * @public
 */
export interface FormKitInputProps<Props extends FormKitInputs<Props>> {
  text: { type: 'text'; value: string }
  number: { type: 'number'; value: number }
}

/**
 * @public
 */
export type MergedProps<Props extends FormKitInputs<Props>> = {
  [K in keyof FormKitInputProps<Props>]: FormKitInputProps<Props>[K] &
    Partial<FormKitBaseProps> &
    Partial<FormKitRuntimeProps>
}

/**
 * All FormKit inputs should be included for this type.
 * @public
 */
export type FormKitInputs<Props extends FormKitInputs<Props>> =
  MergedProps<Props>[keyof MergedProps<Props>]

/**
 * Unique events emitted by each FormKit input. The shape of this interface is:
 *
 * ```ts
 * interface FormKitInputEvents<Props extends Inputs> {
 *   typeString: { customEvent: (value: Props['value']) => any } // <-- All unique events
 * }
 * ```
 *
 * All inputs will also inherit all events from FormKitBaseInputEvents.
 * @public
 */
export interface FormKitInputEvents<Props extends FormKitInputs<Props>> {
  text: {
    custom: (value: Props['value']) => any
  }
}

/**
 * General input events available to all FormKit inputs.
 * @public
 */
export interface FormKitBaseEvents<Props extends FormKitInputs<Props>> {
  input: (value: Props['value'], node: FormKitNode) => any
  inputRaw: (value: Props['value'], node: FormKitNode) => any
  'update:modelValue': (value: Props['value']) => any
  node: (node: FormKitNode) => any
  submit: (data: Props['value'], node: FormKitNode) => any
  submitRaw: (event: Event, node: FormKitNode) => any
  submitInvalid: (node: FormKitNode) => any
}

/**
 * Slots provided by each FormKit input. The shape of this interface is:
 *
 * ```ts
 * interface FormKitInputSlots<Props extends Inputs> {
 *   typeString: { default: (value: Props['value']) => any } // <-- All unique slots
 * }
 * ```
 *
 * There is no automatic inheritance of slots — each slot must be explicitly
 * defined for each input.
 * @public
 */
export interface FormKitInputSlots<Props extends FormKitInputs<Props>> {
  text: {
    default: (value: Props['value']) => any
  }
  number: {
    default: (value: Props['value']) => any
  }
}

/**
 * Options should always be formatted as an array of objects with label and value
 * properties.
 *
 * @public
 */
export interface FormKitOptionsItem {
  label: string
  value: unknown
  attrs?: {
    disabled?: boolean
  } & Record<string, any>
  __original?: any
  [index: string]: any
}

/**
 * An array of option items.
 *
 * @public
 */
export type FormKitOptionsList = FormKitOptionsItem[]

/**
 * Allows for prop extensions to be defined by using an interface whose keys
 * are ignored, but values are applied to a union type. This allows for any
 * third party code to extend the options prop by using module augmentation
 * to add new values to the union type.
 *
 * @public
 */
export interface FormKitOptionsPropExtensions {
  arrayOfStrings: string[]
  arrayOfNumbers: number[]
  optionsList: FormKitOptionsList
  valueLabelPojo: Record<string | number, string>
}

/**
 * The types of options that can be passed to the options prop.
 *
 * @public
 */
export type FormKitOptionsProp =
  FormKitOptionsPropExtensions[keyof FormKitOptionsPropExtensions]

/**
 * All the explicit FormKit props.
 * @public
 */
export const runtimeProps = [
  'config',
  'classes',
  'delay',
  'dynamic',
  'errors',
  'inputErrors',
  'index',
  'id',
  'modelValue',
  'name',
  'parent',
  'plugins',
  'sectionsSchema',
  'sync',
  'type',
  'validation',
  'validationMessages',
  'validationRules',
  'validationLabel',
]

/**
 * Typings for all the built in runtime props.
 *
 * Warning: As of writing these are only specific to Vue’s runtime prop
 * requirements and should not be used as any kind of external API as they are
 * subject to change.
 */
export interface FormKitRuntimeProps {
  config: Record<string, any>
  classes: Record<string, string | Record<string, boolean> | FormKitClasses>
  delay: number
  dynamic: boolean
  errors: string[]
  inputErrors: Record<string, string[]>
  index: number
  id: string
  modelValue: string
  name: string
  parent: FormKitNode
  plugins: FormKitPlugin[]
  sectionsSchema: Record<
    string,
    Partial<FormKitSchemaNode> | FormKitSchemaCondition
  >
  sync: boolean | undefined
  type: string | FormKitTypeDefinition
  validation: string | Array<[rule: string, ...args: any]>
  validationMessages: Record<
    string,
    string | ((ctx: { node: FormKitNode; name: string; args: any[] }) => string)
  >
  validationRules: Record<
    string,
    (node: FormKitNode) => boolean | Promise<boolean>
  >
  validationLabel: string | ((node: FormKitNode) => string)
}

//   config: {
//     type: Object as PropType<Record<string, any>>,
//     default: {},
//   },
//   classes: {
//     type: Object as PropType<
//       Record<string, string | Record<string, boolean> | FormKitClasses>
//     >,
//     required: false,
//   },
//   delay: {
//     type: Number,
//     required: false,
//   },
//   dynamic: {
//     type: Boolean as PropType<boolean | undefined>,
//     required: false,
//   },
//   errors: {
//     type: Array as PropType<string[]>,
//     default: [],
//   },
//   inputErrors: {
//     type: Object as PropType<Record<string, string[]>>,
//     default: () => ({}),
//   },
//   index: {
//     type: Number,
//     required: false,
//   },
//   id: {
//     type: String,
//     required: false,
//   },
//   modelValue: {
//     required: false,
//   },
//   name: {
//     type: String,
//     required: false,
//   },
//   parent: {
//     type: Object as PropType<FormKitNode>,
//     required: false,
//   },
//   plugins: {
//     type: Array as PropType<FormKitPlugin[]>,
//     default: [],
//   },
//   sectionsSchema: {
//     type: Object as PropType<
//       Record<string, Partial<FormKitSchemaNode> | FormKitSchemaCondition>
//     >,
//     default: {},
//   },
//   sync: {
//     type: Boolean as PropType<boolean | undefined>,
//     required: false,
//   },
//   type: {
//     type: [String, Object] as PropType<string | FormKitTypeDefinition>,
//     default: 'text',
//   },
//   validation: {
//     type: [String, Array] as PropType<
//       string | Array<[rule: string, ...args: any]>
//     >,
//     required: false,
//   },
//   validationMessages: {
//     type: Object as PropType<
//       Record<
//         string,
//         | string
//         | ((ctx: { node: FormKitNode; name: string; args: any[] }) => string)
//       >
//     >,
//     required: false,
//   },
//   validationRules: {
//     type: Object as PropType<
//       Record<string, (node: FormKitNode) => boolean | Promise<boolean>>
//     >,
//     required: false,
//   },
//   validationLabel: {
//     type: [String, Function] as PropType<
//       string | ((node: FormKitNode) => string)
//     >,
//     required: false,
//   },
// }

/**
 * Synthetic props are props that are not explicitly declared as props, but
 * should be treated as props to the outside world.
 *
 * @public
 */
export interface FormKitBaseProps {
  /**
   * HTML Attribute, read more here: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#accept
   */
  accept: string
  actions: boolean
  action: string
  label: string
  method: string
  ignore: string | boolean
  enctype: string
  options: FormKitOptionsProp
  help: string
  min: string | number
  max: string | number
  step: string | number
  multiple: string | boolean
  disabled: string | boolean
  preserve: string | boolean
  preserveErrors: string | boolean
  dirtyBehavior: 'touched' | 'compare'
}
