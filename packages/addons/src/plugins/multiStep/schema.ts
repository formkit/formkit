import { FormKitTypeDefinition } from '@formkit/core'
import { $if, outer, wrapper, inner } from '@formkit/inputs'
import {
  stepPrevious,
  stepNext,
  stepOuter,
  tabs,
  tab,
  stepActions,
} from './sections'

export const multiStep: FormKitTypeDefinition = {
  /**
   * The actual schema of the input, or a function that returns the schema.
   */
  schema: outer(tabs(tab('$step.name')), wrapper(inner('$slots.default'))),
  /**
   * The type of node, can be a list, group, or input.
   */
  type: 'group',
  /**
   * The family of inputs this one belongs too. For example "text" and "email"
   * are both part of the "text" family. This is primary used for styling.
   */
  family: '',
  /**
   * An array of extra props to accept for this input.
   */
  props: ['flattenValues', 'allowIncompleteAdvance'],
  /**
   * Additional features that should be added to your input
   */
  features: [],
}

export const step: FormKitTypeDefinition = {
  /**
   * The actual schema of the input, or a function that returns the schema.
   */
  schema: stepOuter(
    wrapper(inner('$slots.default')),
    stepActions(
      $if('$isFirstStep === false', stepPrevious()),
      $if('$isLastStep === false', stepNext())
    )
  ),
  /**
   * The type of node, can be a list, group, or input.
   */
  type: 'group',
  /**
   * The family of inputs this one belongs too. For example "text" and "email"
   * are both part of the "text" family. This is primary used for styling.
   */
  family: '',
  /**
   * An array of extra props to accept for this input.
   */
  props: ['prevLabel', 'nextLabel'],
  /**
   * Additional features that should be added to your input
   */
  features: [],
}
