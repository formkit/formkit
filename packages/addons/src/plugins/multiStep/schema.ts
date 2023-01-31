import { FormKitTypeDefinition } from '@formkit/core'
import { $if, outer, wrapper, defaultIcon, $extend } from '@formkit/inputs'
import {
  badge,
  stepPrevious,
  stepNext,
  stepOuter,
  tab,
  tabLabel,
  tabs,
  steps,
  stepActions,
  stepInner,
  stepIcon,
} from './sections'

export const multiStep: FormKitTypeDefinition = {
  /**
   * The actual schema of the input, or a function that returns the schema.
   */
  schema: outer(
    $extend(
      wrapper(
        tabs(
          tab(
            $if(
              '$tabStyle === "tab" || ($tabStyle === "progress" && $hideProgressLabels === false)',
              tabLabel('$step.stepName')
            ),
            $if(
              '($step.totalErrorCount > 0) && $step.showStepErrors',
              badge('$step.totalErrorCount')
            ),
            $if(
              '$step.isValid && $step.hasBeenVisited',
              badge(stepIcon('validStep'))
            )
          )
        ),
        steps('$slots.default')
      ),
      {
        attrs: {
          'data-tab-style': '$tabStyle',
          'data-hide-labels': '$hideProgressLabels',
        },
      }
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
  props: ['flattenValues', 'allowIncomplete'],
  /**
   * Additional features that should be added to your input
   */
  features: [defaultIcon('validStep', 'check')],
}

export const step: FormKitTypeDefinition = {
  /**
   * The actual schema of the input, or a function that returns the schema.
   */
  schema: stepOuter(
    stepInner('$slots.default'),
    stepActions(stepPrevious(), stepNext())
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
  props: ['label', 'prevLabel', 'nextLabel'],
  /**
   * Additional features that should be added to your input
   */
  features: [],
}
