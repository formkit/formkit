import {
  FormKitNode,
  FormKitPlugin,
  createMessage,
  FormKitFrameworkContext,
} from '@formkit/core'
import { whenAvailable } from '@formkit/utils'
import { multiStep, step } from './schema'

const isBrowser = typeof window !== 'undefined'

/**
 * The options to be passed to {@link createMultiStepPlugin | createMultiStepPlugin}
 *
 * @public
 */
export interface MultiStepOptions {
  // flattenValues?: boolean
  allowIncomplete?: boolean
  hideProgressLabels?: boolean
  tabStyle?: 'tab' | 'progress'
}

type FormKitFrameworkContextWithSteps = FormKitFrameworkContext & {
  steps: FormKitFrameworkContext[]
  stepIndex: number
}

/**
 * Coverts a camelCase string to a title case string
 *
 * @param str - The string to convert
 * @returns string
 */
const camel2title = (str: string) =>
  str
    .replace(/([A-Z])/g, (match: string) => ` ${match}`)
    .replace(/^./, (match: string) => match.toUpperCase())
    .trim()

/**
 * Compares steps to DOM order and reorders steps if needed
 */
function orderSteps(steps: FormKitFrameworkContext[]) {
  const orderedSteps = steps.sort((a, b) => {
    const aEl = document.getElementById(a.id)
    const bEl = document.getElementById(b.id)
    if (!aEl || !bEl) return 0
    return aEl.compareDocumentPosition(bEl) === 2 ? 1 : -1
  })
  steps.map((step) => (step.ordered = true))
  return orderedSteps
}

/**
 * Iterates through each step and sets props to help
 * determine step positioning within the multi-step.
 *
 * @param steps - The steps to iterate through
 */
function setNodePositionProps(steps: FormKitFrameworkContext[]) {
  steps.forEach((step: FormKitFrameworkContext, index: number) => {
    step.isFirstStep = index === 0
    step.isLastStep = index === steps.length - 1
    step.stepIndex = index
    step.steps = steps
  })
}

function showStepErrors(step: FormKitFrameworkContext) {
  if (!step.showStepErrors) return
  return (
    parseInt(step.blockingCount as string) +
      parseInt(step.errorCount as string) >
    0
  )
}

/**
 * Determines if the target step can be navigated to based on current
 * configuration options and the state of the current step.
 *
 * @param currentStep - The current step
 * @param targetStep - The target step
 */
function isTargetStepAllowed(
  currentStep: FormKitFrameworkContext,
  targetStep: FormKitFrameworkContext
) {
  const { allowIncomplete } = currentStep.node.parent?.props || {}
  const parentNode = currentStep.node.parent
  const currentStepIndex = parentNode?.props.steps.indexOf(currentStep)
  const targetStepIndex = parentNode?.props.steps.indexOf(targetStep)

  // check if there is a function for the stepChange guard
  const beforeStepChange =
    currentStep.node.props.beforeStepChange ||
    currentStep.node.parent?.props.beforeStepChange

  if (beforeStepChange && typeof beforeStepChange === 'function') {
    const result = beforeStepChange({
      currentStep,
      targetStep,
      delta: targetStepIndex - currentStepIndex,
    })
    if (typeof result === 'boolean' && !result) return false
  }

  // show the current step errors because this step has
  // been visited.
  triggerStepValidations(currentStep)
  currentStep.showStepErrors = true

  if (targetStepIndex < currentStepIndex) {
    // we can always step backwards
    return true
  }

  // check how many steps we need to step forward
  // and then check that each intermediate step is valid
  const delta = targetStepIndex - currentStepIndex
  for (let i = 0; i < delta; i++) {
    const intermediateStep = parentNode?.props.steps[currentStepIndex + i]
    const stepIsAllowed = allowIncomplete || intermediateStep.state?.valid
    if (!stepIsAllowed) {
      return false
    }
  }

  return true
}

/**
 * Changes the active step to the target step if the target step is allowed.
 *
 * @param targetStep - The target step
 */
function setActiveStep(targetStep: FormKitFrameworkContext, e?: Event) {
  if (e) {
    e.preventDefault()
  }
  if (targetStep && targetStep.node.name && targetStep.node.parent) {
    const currentStep = targetStep.node.parent.props.steps.find(
      (step: FormKitFrameworkContext) =>
        step.node.name === targetStep.node.parent?.props.activeStep
    )
    const stepIsAllowed = isTargetStepAllowed(currentStep, targetStep)

    if (stepIsAllowed && targetStep.node.parent.context) {
      targetStep.node.parent.props.activeStep = targetStep.node.name
    }
  }
}

/**
 * Changes the current step by the delta value if the target step is allowed.
 *
 * @param delta - The number of steps to increment or decrement
 * @param step - The current step
 */
function incrementStep(
  delta: number,
  currentStep: FormKitFrameworkContextWithSteps
) {
  if (currentStep && currentStep.node.name && currentStep.node.parent) {
    const {
      steps,
      stepIndex,
    }: { steps: FormKitFrameworkContext[]; stepIndex: number } = currentStep
    const targetStep = steps[stepIndex + delta]
    const stepIsAllowed = isTargetStepAllowed(currentStep, targetStep)

    if (targetStep && stepIsAllowed) {
      currentStep.node.parent.props.activeStep = targetStep.node.name
    }
  }
}

/**
 * Causes the display of any validation errors on the target step.
 *
 * @param step - The current step
 * @returns Boolean
 */
function triggerStepValidations(step: FormKitFrameworkContext) {
  step.node.walk((n) => {
    n.store.set(
      createMessage({
        key: 'submitted',
        value: true,
        visible: false,
      })
    )
  })
  return (
    step.node.context?.state.valid || step.node.parent?.props.allowIncomplete
  )
}

function initEvents(node: FormKitNode, el: Element) {
  if (!(el instanceof HTMLElement)) return
  el.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.target instanceof HTMLButtonElement) {
      if (
        event.key === 'Tab' &&
        'data-next' in event.target?.attributes &&
        !event.shiftKey
      ) {
        event.preventDefault()
        const activeStepContext = node.children.find(
          (step) => step.name === node.props.activeStep
        )
        if (activeStepContext && activeStepContext.context) {
          incrementStep(
            1,
            activeStepContext.context as FormKitFrameworkContextWithSteps
          )
        }
      }
    }
  })
}

/**
 * Creates a new multi-step plugin.
 *
 * @param options - The options of {@link MultiStepOptions | MultiStepOptions} to pass to the plugin
 *
 * @returns A {@link @formkit/core#FormKitPlugin | FormKitPlugin}
 *
 * @public
 */
export function createMultiStepPlugin(
  options?: MultiStepOptions
): FormKitPlugin {
  const multiStepPlugin = (node: FormKitNode) => {
    if (node.props.type === 'multi-step') {
      node.addProps(['steps', 'activeStep'])

      node.props.allowIncomplete =
        typeof node.props.allowIncomplete === 'boolean'
          ? node.props.allowIncomplete
          : typeof options?.allowIncomplete === 'boolean'
          ? options?.allowIncomplete
          : true
      node.props.hideProgressLabels =
        typeof node.props.hideProgressLabels === 'boolean'
          ? node.props.hideProgressLabels
          : options?.hideProgressLabels || false
      node.props.tabStyle = node.props.tabStyle || options?.tabStyle || 'tab'

      node.on('created', () => {
        if (!node.context) return
        node.context.handlers.triggerStepValidations = triggerStepValidations
        node.context.handlers.showStepErrors = showStepErrors

        whenAvailable(`${node.props.id}`, (el) => {
          initEvents(node, el)
        })
      })

      node.on('prop:activeStep', ({ payload }) => {
        node.children.forEach((child) => {
          child.props.isActiveStep = child.name === payload
          if (isBrowser && child.name === payload) {
            const el = document.querySelector(
              `[aria-controls="${child.props.id}"]`
            )
            if (el instanceof HTMLButtonElement) {
              el.focus()
            }
          }
        })
      })

      node.on('childRemoved', ({ payload: childNode }) => {
        let removedStepIndex = -1
        node.props.steps = node.props.steps.filter(
          (step: FormKitFrameworkContext, index: number) => {
            if (step.node.name !== childNode.name) {
              return true
            }
            removedStepIndex = index
            return false
          }
        )
        // if the child that was removed was the active step
        // then fallback to the next available step
        if (node.props.activeStep === childNode.name) {
          const targetIndex = removedStepIndex > 0 ? removedStepIndex - 1 : 0
          node.props.activeStep = node.props.steps[targetIndex]
            ? node.props.steps[targetIndex].node.name
            : ''
        }

        // recompute step positions
        orderSteps(node.props.steps)
        setNodePositionProps(node.props.steps)
      })
    }
    if (
      node.props.type === 'step' &&
      node.parent?.props.type === 'multi-step'
    ) {
      node.addProps([
        'isActiveStep',
        'isFirstStep',
        'isLastStep',
        'stepName',
        'errorCount',
        'blockingCount',
        'totalErrorCount',
        'showStepErrors',
        'isValid',
        'hasBeenVisited',
        'ordered',
      ])
      node.on('created', () => {
        if (!node.context) return
        if (node.parent && node.parent.context) {
          node.props.stepName = node.props.label || camel2title(node.name)
          node.props.errorCount = 0
          node.props.blockingCount = 0
          node.props.isActiveStep = false

          const parentNode = node.parent

          parentNode.props.steps = Array.isArray(parentNode.props.steps)
            ? [...parentNode.props.steps, node.context]
            : [node.context]

          whenAvailable(`${node.props.id}`, () => {
            parentNode.props.steps = orderSteps(parentNode.props.steps)
            setNodePositionProps(parentNode.props.steps)

            parentNode.props.activeStep = parentNode.props.activeStep
              ? parentNode.props.activeStep
              : parentNode.props.steps[0]
              ? parentNode.props.steps[0].node.name
              : ''
          })

          if (node.context && parentNode.context) {
            parentNode.context.handlers.setActiveStep = (
              stepNode: FormKitFrameworkContext
            ) => setActiveStep.bind(null, stepNode)
            node.context.handlers.incrementStep = (
              delta: number,
              stepNode: FormKitFrameworkContextWithSteps
            ) => incrementStep.bind(null, delta, stepNode)
            node.context.makeActive = () => {
              setActiveStep(node.context as FormKitFrameworkContext)
            }
            node.context.handlers.next = () =>
              incrementStep(1, node.context as FormKitFrameworkContextWithSteps)
            node.context.handlers.previous = () =>
              incrementStep(
                -1,
                node.context as FormKitFrameworkContextWithSteps
              )
          }
        }
      })

      node.on('count:errors', ({ payload: count }) => {
        node.props.errorCount = count
      })
      node.on('count:blocking', ({ payload: count }) => {
        node.props.blockingCount = count
      })

      function updateTotalErrorCount(node: FormKitNode) {
        node.props.totalErrorCount =
          node.props.errorCount + node.props.blockingCount
      }
      node.on('prop:errorCount', () => updateTotalErrorCount(node))
      node.on('prop:blockingCount', () => updateTotalErrorCount(node))
      node.on('prop:totalErrorCount', () => {
        node.props.isValid = node.props.totalErrorCount <= 0
      })

      node.on('message-added', ({ payload }) => {
        if (payload.key === 'submitted') {
          updateTotalErrorCount(node)
          if (node.context) {
            triggerStepValidations(node.context)
            node.props.showStepErrors = true
          }
        }
      })

      node.on('prop:isActiveStep', () => {
        if (!node.props.hasBeenVisited && node.props.isActiveStep) {
          node.props.hasBeenVisited = true
        }
      })
    } else if (node.parent?.props.type === 'multi-step') {
      console.warn(
        'Invalid FormKit input location. <FormKit type="multi-step"> should only have <FormKit type="step"> inputs as immediate children. Failure to wrap child inputs in <FormKit type="step"> can lead to undesired behaviors.'
      )
    }
  }

  multiStepPlugin.library = (node: FormKitNode) => {
    switch (node.props.type) {
      case 'multi-step':
        return node.define(multiStep)
      case 'step':
        const isInvalid =
          !node.parent || node.parent.props.type !== 'multi-step'
        if (isInvalid) {
          console.warn(
            'Invalid use of <FormKit type="step">. <FormKit type="step"> must be an immediate child of a <FormKit type="multi-step"> component.'
          )
        }
        return node.define(step)
    }
  }

  return multiStepPlugin
}
