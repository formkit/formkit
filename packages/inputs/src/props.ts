/**
 * Options should always be formatted as an array of objects with label and value
 * properties.
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
 * @public
 */
export type FormKitOptionsList = FormKitOptionsItem[]

/**
 * Allows for prop extensions to be defined by using an interface whose keys
 * are ignored, but values are applied to a union type. This allows for any
 * third party code to extend the options prop by using module augmentation
 * to add new values to the union type.
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
 * @public
 */
export type FormKitOptionsProp =
  FormKitOptionsPropExtensions[keyof FormKitOptionsPropExtensions]

/**
 * Synthetic props are props that are not explicitly declared as props, but
 * should be treated as props to the outside world.
 * @public
 */
export interface FormKitSyntheticPropsExtensions {
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
}

/**
 * The synthetic prop types.
 * @public
 */
export type FormKitSyntheticProps = {
  [Property in keyof FormKitSyntheticPropsExtensions]: FormKitSyntheticPropsExtensions[Property]
}
