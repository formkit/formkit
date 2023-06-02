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
export interface FormKitInputProps {
  text: { type: 'text'; value: string }
  number: { type: 'number'; value: number }
}

/**
 * @public
 */
export type MergedProps = {
  [K in keyof FormKitInputProps]: FormKitInputProps[K] &
    Partial<FormKitBaseProps>
}

/**
 * All FormKit inputs should be included for this type.
 * @public
 */
export type FormKitInputs = MergedProps[keyof MergedProps]

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
export interface FormKitInputEvents<Props extends FormKitInputs> {
  text: {
    input: (value: Props['value']) => any
  }
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
export interface FormKitInputSlots<Props extends FormKitInputs> {
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
