import {
  FormKitPlugin,
  FormKitGroupValue,
  FormKitTypeDefinition,
  FormKitSectionsSchema,
  FormKitNode,
  FormKitClasses,
  FormKitFrameworkContext,
  FormKitMessage,
} from '@formkit/core'
import { FormKitFile } from './index'

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
  number: undefined
}

/**
 * An attempt to capture all non-undefined values. This is used to define
 * various conditionals where undefined is not a concrete type, but all other
 * values need to take one logical branch.
 *
 * @public
 */
export type AllReals =
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
  button: { type: 'button'; value?: undefined }
  checkbox: {
    type: 'checkbox'
    options?: FormKitOptionsProp
    onValue?: any
    offValue?: any
    value?: Props['options'] extends Record<infer T, string>
      ? T[]
      : Props['options'] extends FormKitOptionsItem[]
      ? Array<Props['options'][number]['value']>
      : Props['options'] extends Array<infer T>
      ? T[]
      :
          | (Props['onValue'] extends AllReals ? Props['onValue'] : true)
          | (Props['offValue'] extends AllReals ? Props['offValue'] : false)
  }
  color: { type: 'color'; value?: string }
  date: { type: 'date'; value?: string }
  datetimeLocal: { type: 'datetimeLocal'; value?: string }
  email: {
    type: 'email'
    value?: string
  }
  file: { type: 'file'; value?: FormKitFile[] }
  form: {
    type: 'form'
    value?: FormKitGroupValue
    actions?: boolean | string
    submitAttrs?: Record<string, any>
    submitBehavior?: 'disabled' | 'live'
    incompleteMessage?: false | string
  }
  group: { type: 'group'; value?: FormKitGroupValue }
  hidden: {
    type: 'hidden'
    value?: Props['number'] extends AllReals ? number : string
    number?: 'integer' | 'float' | 'true' | true
  }
  list: {
    type: 'list'
    value?: unknown[]
    dynamic?: boolean | 'true' | 'false'
    sync?: boolean | 'true' | 'false'
  }
  meta: { type: 'meta'; value?: any }
  month: { type: 'month'; value?: string }
  number: {
    type: 'number'
    value?: Props['number'] extends AllReals ? number : string
    number?: 'integer' | 'float' | 'true' | true
  }
  password: { type: 'password'; value?: string }
  radio: {
    type: 'radio'
    options: FormKitOptionsProp
    value?: FormKitOptionsValue<Props['options']>
  }
  range: {
    type: 'range'
    value?: Props['number'] extends AllReals ? number : string
    number?: 'integer' | 'float' | 'true' | true
  }
  search: {
    type: 'search'
    value?: Props['number'] extends AllReals ? number | string : string
    number?: 'integer' | 'float' | 'true' | true
  }
  select: {
    type: 'select'
    options?: FormKitOptionsPropWithGroups
    value?: FormKitOptionsValue<Props['options']>
  }
  submit: { type: 'submit'; value?: string }
  tel: {
    type: 'tel'
    value?: Props['number'] extends AllReals ? number | string : string
    number?: 'integer' | 'float' | 'true' | true
  }
  text: {
    type: 'text'
    value?: Props['number'] extends AllReals ? number | string : string
    number?: 'integer' | 'float' | 'true' | true
  }
  textarea: { type: 'textarea'; value?: string }
  time: { type: 'time'; value?: string }
  url: { type: 'url'; value?: string }
  week: { type: 'week'; value?: string }
  // This fallthrough is for inputs that do not have their type set. These
  // are effectively "text" inputs.
  _: {
    type?: Props['type'] extends keyof FormKitInputProps<Props>
      ? never
      : Props['type']
    value?: string
  }
}

/**
 * A merger of input props, base props, and conditional props. This is then
 * used as the structure for the FormKitInputs type.
 * @public
 */
export type MergedProps<Props extends FormKitInputs<Props>> = {
  [K in keyof FormKitInputProps<Props>]: Omit<
    Partial<FormKitBaseProps>,
    keyof FormKitInputProps<Props>[K]
  > &
    Omit<
      Partial<FormKitRuntimeProps<Props>>,
      keyof FormKitInputProps<Props>[K]
    > &
    Omit<Partial<FormKitConditionalProps>, keyof FormKitInputProps<Props>[K]> &
    Partial<
      K extends keyof FormKitInputEventsAsProps<Props>
        ? Omit<
            FormKitEventsAsProps,
            keyof FormKitInputEventsAsProps<Props>[K]
          > &
            FormKitInputEventsAsProps<Props>[K]
        : FormKitEventsAsProps
    > &
    FormKitInputProps<Props>[K]
}

/**
 * Merge all events into a single type. This is then used as the structure for
 *
 * @public
 */
export type MergedEvents<Props extends FormKitInputs<Props>> =
  InputType<Props> extends keyof FormKitInputEvents<Props>
    ? FormKitBaseEvents<Props> & FormKitInputEvents<Props>[InputType<Props>]
    : FormKitBaseEvents<Props>

/**
 * Selects the "type" from the props if it exists, otherwise it defaults to
 * "text".
 *
 * @public
 */
export type InputType<Props extends FormKitInputs<Props>> =
  Props['type'] extends string ? Props['type'] : 'text'

/**
 * All FormKit events should be included for a given set of props.
 *
 * @public
 */
export type FormKitEvents<Props extends FormKitInputs<Props>> =
  MergedEvents<Props>

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
    (event: 'submit-raw', e: Event, node: FormKitNode): any
    (event: 'submit-invalid', node: FormKitNode): any
    (event: 'submit', data: any, node: FormKitNode): any
  }
}

/**
 * Extracts the type from a given prop.
 * @public
 */
export type PropType<
  Props extends FormKitInputs<Props>,
  T extends keyof FormKitInputs<Props>
> = Extract<
  FormKitInputs<Props>,
  { type: Props['type'] extends string ? Props['type'] : 'text' }
>[T]

/**
 * The proper shape of data to be passed to options prop.
 * @public
 */
export type FormKitOptionsValue<Options> = Options extends FormKitOptionsProp
  ? Options extends Record<infer T, string>
    ? T
    : Options extends FormKitOptionsItem[]
    ? Options[number]['value']
    : Options extends Array<infer T>
    ? T
    : unknown
  : unknown

/**
 * General input events available to all FormKit inputs.
 * @public
 */
export interface FormKitBaseEvents<Props extends FormKitInputs<Props>> {
  (event: 'input', value: PropType<Props, 'value'>, node: FormKitNode): any
  (event: 'inputRaw', value: PropType<Props, 'value'>, node: FormKitNode): any
  (event: 'input-raw', value: PropType<Props, 'value'>, node: FormKitNode): any
  (event: 'update:modelValue', value: PropType<Props, 'value'>): any
  (event: 'update:model-value', value: PropType<Props, 'value'>): any
  (event: 'node', node: FormKitNode): any
}

/**
 * In a perfect world this interface would not be required at all. However, Vue
 * expects the interfaces to be defined as method overloads. Unfortunately since
 * our events interface uses generics UnionToIntersection is not able to be used
 * meaning that we lose event data if we store the events as a standard
 * interface with property keys. The only way we have found to reliably get
 * Volar (as of June 2023) to properly recognize all defined events is to use
 * a the "standard" method overload approach (see FormKitBaseEvents).
 *
 * (Basically we cannot use the events in this interface to automatically
 * produce the FormKitBaseEvents without Volar loosing event data)
 *
 * This means we have no way to get the event names out of the interface so we
 * cannot properly use them in our props. This matters for things like TSX
 * support where the event names need to be available as `onEventName` props.
 *
 * This interface is used to manually patch that gap in the type system. These
 * types should match up 1-1 with the events defined in FormKitBaseEvents as
 * well as FormKitInputEvents.
 *
 * @public
 */
export interface FormKitEventsAsProps {
  onInput: (value: unknown, node: FormKitNode) => any
  onInputRaw: (value: unknown, node: FormKitNode) => any
  'onUpdate:modelValue': (value: unknown, node: FormKitNode) => any
  onNode: (node: FormKitNode) => any
}

/**
 * See the comment tome on {@link FormKitEventsAsProps} for why this type is
 * necessary.
 *
 * @public
 */
export interface FormKitInputEventsAsProps<Props extends FormKitInputs<Props>> {
  form: {
    onSubmitRaw: (e: Event, node: FormKitNode) => any
    onSubmitInvalid: (node: FormKitNode) => any
    onSubmit: (data: any, node: FormKitNode) => any
  }
}

/**
 * The shape of the context object that is passed to each slot.
 * @public
 */
export interface FormKitSlotData<
  Props extends FormKitInputs<Props>,
  E extends Record<string, any> = {}
> {
  (context: FormKitFrameworkContext<PropType<Props, 'value'>> & E): any
}

/**
 * Nearly all inputs in FormKit have a "base" set of slots. This is the
 * "sandwich" around the input itself, like the wrappers, help text, error
 * messages etc. Several other input’s slots extend this base interface.
 * @public
 */
export interface FormKitBaseSlots<Props extends FormKitInputs<Props>> {
  help: FormKitSlotData<Props>
  inner: FormKitSlotData<Props>
  input: FormKitSlotData<Props>
  label: FormKitSlotData<Props>
  message: FormKitSlotData<Props, { message: FormKitMessage }>
  messages: FormKitSlotData<Props>
  outer: FormKitSlotData<Props>
  prefix: FormKitSlotData<Props>
  prefixIcon: FormKitSlotData<Props>
  suffix: FormKitSlotData<Props>
  suffixIcon: FormKitSlotData<Props>
  wrapper: FormKitSlotData<Props>
}

/**
 * The slots available to the FormKitText input, these extend the base slots.
 * @public
 */
export interface FormKitTextSlots<Props extends FormKitInputs<Props>>
  extends FormKitBaseSlots<Props> {}

/**
 * The data available to slots that have an option in scope.
 * @public
 */
export interface OptionSlotData<Props extends FormKitInputs<Props>> {
  option: FormKitOptionsItem<PropType<Props, 'value'>>
}

/**
 * The slots available to the select input, these extend the base slots.
 * @public
 */
export interface FormKitSelectSlots<Props extends FormKitInputs<Props>>
  extends FormKitBaseSlots<Props> {
  default: FormKitSlotData<Props>
  option: FormKitSlotData<Props, OptionSlotData<Props>>
  selectIcon: FormKitSlotData<Props>
}

/**
 * The slots available to the checkbox inputs even when options are not provided, these extend the base slots.
 * @public
 */
export interface FormKitCheckboxSlots<Props extends FormKitInputs<Props>>
  extends FormKitBaseSlots<Props> {
  decorator: FormKitSlotData<Props, OptionSlotData<Props>>
  decoratorIcon: FormKitSlotData<Props, OptionSlotData<Props>>
}

/**
 * The slots available to the radio and checkbox inputs when options are
 * provided.
 * @public
 */
export interface FormKitBoxSlots<Props extends FormKitInputs<Props>> {
  fieldset: FormKitSlotData<Props>
  legend: FormKitSlotData<Props>
  help: FormKitSlotData<Props>
  options: FormKitSlotData<Props>
  option: FormKitSlotData<Props, OptionSlotData<Props>>
  wrapper: FormKitSlotData<Props, OptionSlotData<Props>>
  inner: FormKitSlotData<Props, OptionSlotData<Props>>
  input: FormKitSlotData<Props, OptionSlotData<Props>>
  label: FormKitSlotData<Props, OptionSlotData<Props>>
  prefix: FormKitSlotData<Props, OptionSlotData<Props>>
  suffix: FormKitSlotData<Props, OptionSlotData<Props>>
  decorator: FormKitSlotData<Props, OptionSlotData<Props>>
  decoratorIcon: FormKitSlotData<Props, OptionSlotData<Props>>
  optionHelp: FormKitSlotData<Props, OptionSlotData<Props>>
  box: FormKitSlotData<Props, OptionSlotData<Props>>
  icon: FormKitSlotData<Props, OptionSlotData<Props>>
  message: FormKitSlotData<Props, { message: FormKitMessage }>
  messages: FormKitSlotData<Props>
}

/**
 * The slots available to the file input, these extend the base slots.
 * @public
 */
export interface FormKitFileSlots<Props extends FormKitInputs<Props>>
  extends FormKitBaseSlots<Props> {
  fileList: FormKitSlotData<Props>
  fileItem: FormKitSlotData<Props>
  fileItemIcon: FormKitSlotData<Props, { file: FormKitFile }>
  fileName: FormKitSlotData<Props, { file: FormKitFile }>
  fileRemove: FormKitSlotData<Props, { file: FormKitFile }>
  fileRemoveIcon: FormKitSlotData<Props, { file: FormKitFile }>
  noFiles: FormKitSlotData<Props>
}

/**
 * The slots available to the button input, these extend the base slots.
 *
 * @public
 */
export type FormKitButtonSlots<Props extends FormKitInputs<Props>> = Omit<
  FormKitBaseSlots<Props>,
  'inner'
> & {
  default: FormKitSlotData<Props>
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
  text: FormKitTextSlots<Props>
  color: FormKitTextSlots<Props>
  date: FormKitTextSlots<Props>
  'datetime-local': FormKitTextSlots<Props>
  email: FormKitTextSlots<Props>
  month: FormKitTextSlots<Props>
  number: FormKitTextSlots<Props>
  password: FormKitTextSlots<Props>
  search: FormKitTextSlots<Props>
  tel: FormKitTextSlots<Props>
  time: FormKitTextSlots<Props>
  url: FormKitTextSlots<Props>
  week: FormKitTextSlots<Props>
  range: FormKitTextSlots<Props>
  // Technically textarea has a unique schema, but the slots are the same:
  textarea: FormKitTextSlots<Props>
  select: FormKitSelectSlots<Props>
  radio: Props['options'] extends AllReals
    ? FormKitBoxSlots<Props>
    : FormKitBaseSlots<Props>
  list: { default: FormKitSlotData<Props> }
  hidden: { input: FormKitSlotData<Props> }
  meta: { wrapper: FormKitSlotData<Props> }
  group: { default: FormKitSlotData<Props> }
  form: {
    form: FormKitSlotData<Props>
    default: FormKitSlotData<Props>
    message: FormKitSlotData<Props, { message: FormKitMessage }>
    messages: FormKitSlotData<Props>
    actions: FormKitSlotData<Props>
    submit: FormKitSlotData<Props>
  }
  file: FormKitFileSlots<Props>
  checkbox: Props['options'] extends AllReals
    ? FormKitBoxSlots<Props>
    : FormKitCheckboxSlots<Props>
  submit: FormKitButtonSlots<Props>
  button: FormKitButtonSlots<Props>
}

/**
 * Options should always be formatted as an array of objects with label and value
 * properties.
 *
 * @public
 */
export interface FormKitOptionsItem<V = unknown> {
  label: string
  value: V
  attrs?: {
    disabled?: boolean
  } & Record<string, any>
  __original?: any
  [index: string]: any
}

/**
 * Option groups should always be formatted as an array of objects with group and nested options
 */
export interface FormKitOptionsGroupItemProp {
  group: string
  options: FormKitOptionsProp
  attrs?: Record<string, any>
}

/**
 * Option groups should always be formatted as an array of objects with group and nested options
 */
export interface FormKitOptionsGroupItem {
  group: string
  options: FormKitOptionsList
  attrs?: Record<string, any>
}

/**
 * An array of option items.
 *
 * @public
 */
export type FormKitOptionsList = FormKitOptionsItem[]

/**
 * An array of option items with a group.
 *
 * @public
 */
export type FormKitOptionsListWithGroups = Array<
  FormKitOptionsItem | FormKitOptionsGroupItem
>

/**
 * An array of option items with a group support — where the `option` of the
 * groups can be any valid FormKitOptionsProp type.
 */
export type FormKitOptionsListWithGroupsProp = Array<
  FormKitOptionsItem | FormKitOptionsGroupItemProp
>

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
 * The types of options that can be passed to the options prop.
 *
 * @public
 */
export type FormKitOptionsPropWithGroups =
  | FormKitOptionsProp
  | FormKitOptionsListWithGroupsProp

/**
 * Typings for all the built in runtime props.
 *
 * Warning: As of writing these are only specific to Vue’s runtime prop
 * requirements and should not be used as any kind of external API as they are
 * subject to change.
 *
 * @public
 */
export interface FormKitRuntimeProps<Props extends FormKitInputs<Props>> {
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
  modelValue: PropType<Props, 'value'>
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
  sectionsSchema: FormKitSectionsSchema
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
  actions: 'true' | 'false' | boolean
  dirtyBehavior: 'touched' | 'compare'
  disabled: 'true' | 'false' | boolean
  enctype: string
  help: string
  ignore: 'true' | 'false' | boolean
  label: string
  max: string | number
  method: string
  min: string | number
  multiple: 'true' | 'false' | boolean
  preserve: 'true' | 'false' | boolean
  preserveErrors: 'true' | 'false' | boolean
  placeholder: string
  step: string | number
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
  'errors',
  'id',
  'index',
  'inputErrors',
  'modelValue',
  'onUpdate:modelValue',
  'name',
  'number',
  'parent',
  'plugins',
  'sectionsSchema',
  'type',
  'validation',
  'validationLabel',
  'validationMessages',
  'validationRules',
  // Runtime event props:
  'onInput',
  'onInputRaw',
  'onUpdate:modelValue',
  'onNode',
  'onSubmit',
  'onSubmitInvalid',
  'onSubmitRaw',
]

/**
 * A helper to determine if an option is a group or an option.
 * @param option - An option
 */
export function isGroupOption(
  option:
    | FormKitOptionsItem
    | FormKitOptionsGroupItem
    | FormKitOptionsGroupItemProp
): option is FormKitOptionsGroupItem {
  return (
    option &&
    typeof option === 'object' &&
    'group' in option &&
    Array.isArray(option.options)
  )
}
