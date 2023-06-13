import { FormKitPlugin, FormKitGroupValue } from '@formkit/core'
import { FormKitSchemaCondition } from '@formkit/core'
import { FormKitTypeDefinition } from '@formkit/core'
import { FormKitSchemaNode } from '@formkit/core'
import { FormKitNode } from '@formkit/core'
import { FormKitClasses } from '@formkit/core'

/**
 * These are props that are used as conditionals in one or more inputs, and as
 * such they need to be defined on all input types. These should all be defined
 * explicitly as "undefined" here, and then defined as their specific type
 * in the FormKitInputProps interface only on the inputs that use them.
 * @public
 */
export interface FormKitConditionalProps {
  onValue: undefined
  offValue: undefined
  options: undefined
}

type AllReals =
  | number
  | string
  | boolean
  | CallableFunction
  | Array<any>
  | null
  | Record<any, any>

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
 *
 * Note: It is important that all inputs provide a type and a value prop.
 * @public
 */
export interface FormKitInputProps<Props extends FormKitInputs<Props>> {
  text: { type: 'text' }
  color: { type: 'color' }
  date: { type: 'date' }
  datetimeLocal: { type: 'datetimeLocal' }
  email: { type: 'email' }
  month: { type: 'month' }
  password: { type: 'password' }
  search: { type: 'search' }
  tel: { type: 'tel' }
  time: { type: 'time' }
  url: { type: 'url' }
  week: { type: 'week' }
  range: { type: 'range' }
  number: { type: 'number' }
  button: { type: 'button' }
  submit: { type: 'submit' }
  checkbox: {
    type: 'checkbox'
    options?: FormKitOptionsProp
    onValue?: any
    offValue?: any
    value?: Props['options'] extends Record<infer T, string>
      ? T[]
      : Props['options'] extends FormKitOptionsItem[]
      ? Props['options'][number]['value']
      : Props['options'] extends Array<infer T>
      ? T[]
      :
          | (Props['onValue'] extends AllReals ? Props['onValue'] : true)
          | (Props['offValue'] extends AllReals ? Props['offValue'] : false)
  }
  file: { type: 'file' }
  form: { type: 'form'; value?: FormKitGroupValue }
  group: { type: 'group'; value?: FormKitGroupValue }
  hidden: { type: 'hidden' }
  list: { type: 'list'; value?: unknown[] }
  radio: { type: 'radio' }
  select: { type: 'select' }
  textarea: { type: 'textarea' }
}

/**
 * @public
 */
export type MergedProps<Props extends FormKitInputs<Props>> = {
  [K in keyof FormKitInputProps<Props>]: Omit<
    Partial<FormKitBaseProps>,
    keyof FormKitInputProps<Props>[K]
  > &
    Omit<Partial<FormKitRuntimeProps>, keyof FormKitInputProps<Props>[K]> &
    Omit<Partial<FormKitConditionalProps>, keyof FormKitInputProps<Props>[K]> &
    FormKitInputProps<Props>[K]
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
 *   typeString: { customEvent: (value: PropType<Props, 'value'>) => any } // <-- All unique events
 * }
 * ```
 *
 * All inputs will also inherit all events from FormKitBaseInputEvents.
 * @public
 */
export interface FormKitInputEvents<Props extends FormKitInputs<Props>> {
  form: {
    (
      event: 'submit',
      data: PropType<Props, 'value'>,
      node: FormKitNode<PropType<Props, 'value'>>
    ): any
    (
      event: 'submitRaw',
      e: Event,
      node: FormKitNode<PropType<Props, 'value'>>
    ): any
  }
}

type PropType<
  Props extends FormKitInputs<Props>,
  T extends keyof FormKitInputs<Props>
> = Extract<FormKitInputs<Props>, { type: Props['type'] }>[T]

/**
 * General input events available to all FormKit inputs.
 * @public
 */
export interface FormKitBaseEvents<Props extends FormKitInputs<Props>> {
  (
    event: 'input',
    value: PropType<Props, 'value'>,
    node: FormKitNode<PropType<Props, 'value'>>
  ): any
  (
    event: 'inputRaw',
    value: PropType<Props, 'value'>,
    node: FormKitNode<PropType<Props, 'value'>>
  ): any
  (event: 'update:modelValue', value: PropType<Props, 'value'>): any
  (event: 'node', node: FormKitNode): any
  (event: 'submitInvalid', node: FormKitNode): any
}

/**
 * Slots provided by each FormKit input. The shape of this interface is:
 *
 * ```ts
 * interface FormKitInputSlots<Props extends Inputs> {
 *   typeString: { default: (value: PropType<Props, 'value'>) => any } // <-- All unique slots
 * }
 * ```
 *
 * There is no automatic inheritance of slots — each slot must be explicitly
 * defined for each input.
 * @public
 */
export interface FormKitInputSlots<Props extends FormKitInputs<Props>> {
  text: {
    default: (value: PropType<Props, 'value'>) => any
  }
  number: {
    default: (value: PropType<Props, 'value'>) => any
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
 * Typings for all the built in runtime props.
 *
 * Warning: As of writing these are only specific to Vue’s runtime prop
 * requirements and should not be used as any kind of external API as they are
 * subject to change.
 *
 * @public
 */
export interface FormKitRuntimeProps {
  /**
   * An object of configuration data for the input and its children.
   */
  config: Record<string, any>
  /**
   * An object of classes to be applied to the input.
   */
  classes: Record<string, string | Record<string, boolean> | FormKitClasses>
  /**
   * Amount of time to debounce input before committing.
   */
  delay: number
  /**
   * A boolean indicating whether the list input is dynamic.
   */
  dynamic: boolean
  /**
   * An array of errors for the input.
   */
  errors: string[]
  /**
   * A object of values
   */
  inputErrors: Record<string, string[]>
  /**
   * An explicit index to mount a child of a list at.
   */
  index: number
  /**
   * A globally unique identifier for the input — this passes through to the
   * id attribute.
   */
  id: string
  /**
   * The dynamic value of the input.
   */
  modelValue: string
  /**
   * The name of the input.
   */
  name: string
  /**
   * An explicit parent node for the input.
   */
  parent: FormKitNode
  /**
   * An array of plugins to apply to the input.
   */
  plugins: FormKitPlugin[]
  /**
   * An object of sections to merge with the input’s internal schema.
   */
  sectionsSchema: Record<
    string,
    Partial<FormKitSchemaNode> | FormKitSchemaCondition
  >
  /**
   * A boolean indicating whether the input should be synced with the model.
   */
  sync: boolean | undefined
  /**
   * The type of the input.
   */
  type: string | FormKitTypeDefinition
  /**
   * A validation string or array of validation rules.
   */
  validation: string | Array<[rule: string, ...args: any]>
  /**
   * An object of validation messages to use for the input.
   */
  validationMessages: Record<
    string,
    string | ((ctx: { node: FormKitNode; name: string; args: any[] }) => string)
  >
  /**
   * An object of additional validation rules to use for the input.
   */
  validationRules: Record<
    string,
    (node: FormKitNode) => boolean | Promise<boolean>
  >
  /**
   * Use this to override the default validation label in validation messages.
   */
  validationLabel: string | ((node: FormKitNode) => string)
}

/**
 * Base props that should be applied to all FormKit inputs. These are not actual
 * runtime props and are pulled from the context.attrs object. Many of these are
 * just html attributes that are passed through to the input element.
 *
 * @public
 */
export interface FormKitBaseProps {
  /**
   * HTML Attribute, read more here: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#accept
   */
  accept: string
  action: string
  actions: boolean
  dirtyBehavior: 'touched' | 'compare'
  disabled: string | boolean
  enctype: string
  help: string
  ignore: string | boolean
  label: string
  max: string | number
  method: string
  min: string | number
  multiple: string | boolean
  preserve: string | boolean
  preserveErrors: string | boolean
  placeholder: string
  step: string | number
  value: string
}

/**
 * All the explicit FormKit props that need to be passed to FormKit’s Vue
 * component instance.
 * @public
 */
export const runtimeProps = [
  'classes',
  'config',
  'delay',
  'dynamic',
  'errors',
  'id',
  'index',
  'inputErrors',
  'modelValue',
  'name',
  'parent',
  'plugins',
  'sectionsSchema',
  'sync',
  'type',
  'validation',
  'validationLabel',
  'validationMessages',
  'validationRules',
]
