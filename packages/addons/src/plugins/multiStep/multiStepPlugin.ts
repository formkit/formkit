import {
  FormKitNode,
  FormKitPlugin,
  createMessage,
  FormKitFrameworkContext,
  isPlaceholder,
} from '@formkit/core'
import { whenAvailable } from '@formkit/utils'
import type { FormKitSlotData, FormKitInputs } from '@formkit/inputs'
import { multiStep, step } from './schema'

/* <declare> */

/**
 * Extend FormKitNode with Multi-step helper functions.
 */
declare module '@formkit/core' {
  interface FormKitNodeExtensions {
    next(): void
    previous(): void
    goTo(step: number | string): void
  }
}
/* </declare> */

/* <declare> */
declare module '@formkit/inputs' {
  interface FormKitInputProps<Props extends FormKitInputs<Props>> {
    'multi-step': {
      type: 'multi-step'
      value?: Record<string, any>
      allowIncomplete?: boolean
      tabStyle?: 'tab' | 'progress'
      hideProgressLabels?: boolean
      validStepIcon?: string
      beforeStepChange?: (
        currentStep: FormKitFrameworkContext,
        nextStep: FormKitFrameworkContext,
        delta: number
      ) => any
    }

    step: {
      type: 'step'
      previousLabel?: string
      nextLabel?: string
      previousAttrs?: Record<string, any>
      nextAttrs?: Record<string, any>
      validStepIcon?: string
      beforeStepChange?: (
        currentStep: FormKitFrameworkContext,
        nextStep: FormKitFrameworkContext,
        delta: number
      ) => any
    }
  }

  interface FormKitInputSlots<Props extends FormKitInputs<Props>> {
    'multi-step': FormKitMultiStepSlots<Props>
    step: FormKitStepSlots<Props>
  }
}

export interface MultiStepSlotData {
  steps: FormKitFrameworkContext[]
}

export interface StepSlotData {
  step: FormKitFrameworkContext
  index: number
  node: FormKitNode & { context: FormKitFrameworkContextWithSteps }
  handlers: FormKitFrameworkContext['handlers'] & {
    incrementStep: (
      delta: number,
      currentStep: FormKitFrameworkContext | undefined
    ) => () => void
  }
}

export interface FormKitMultiStepSlots<Props extends FormKitInputs<Props>> {
  multiStepOuter: FormKitSlotData<Props, MultiStepSlotData>
  wrapper: FormKitSlotData<Props, MultiStepSlotData>
  tabs: FormKitSlotData<Props, MultiStepSlotData>
  tab: FormKitSlotData<Props, MultiStepSlotData>
  tabLabel: FormKitSlotData<Props, MultiStepSlotData>
  badge: FormKitSlotData<Props, MultiStepSlotData>
  stepIcon: FormKitStepSlots<Props>
  steps: FormKitSlotData<Props, MultiStepSlotData>
  step: FormKitStepSlots<Props>
}

export interface FormKitStepSlots<Props extends FormKitInputs<Props>> {
  stepInner: FormKitSlotData<Props, StepSlotData>
  stepActions: FormKitSlotData<Props, StepSlotData>
  stepNext: FormKitSlotData<Props, StepSlotData>
  stepPrevious: FormKitSlotData<Props, StepSlotData>
}

/* </declare> */

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

type FormKitFrameworkContextWithSteps =
  | (FormKitFrameworkContext & {
      steps: FormKitFrameworkContext[]
      stepIndex: number
    })
  | undefined

/**
 * Coverts a camelCase string to a title case string
 *
 * @param str - The string to convert
 * @returns string
 */
const camel2title = (str: string) => {
  if (!str) return str
  return str
    .replace(/([A-Z])/g, (match: string) => ` ${match}`)
    .replace(/^./, (match: string) => match.toUpperCase())
    .trim()
}

/**
 * Compares steps to DOM order and reorders steps if needed
 */
function orderSteps(node: FormKitNode, steps: FormKitFrameworkContext[]) {
  if (!isBrowser || !steps) return steps
  const orderedSteps = [...steps]
  orderedSteps.sort((a, b) => {
    const aEl = node.props.__root?.getElementById(a.id)
    const bEl = node.props.__root?.getElementById(b.id)
    if (!aEl || !bEl) return 0
    return aEl.compareDocumentPosition(bEl) === 2 ? 1 : -1
  })
  orderedSteps.map((step) => {
    step.ordered = true
  })
  return orderedSteps
}

/**
 * Iterates through each step and sets props to help
 * determine step positioning within the multi-step.
 *
 * @param steps - The steps to iterate through
 */
function setNodePositionProps(steps: FormKitFrameworkContext[]) {
  if (!steps) return
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
async function isTargetStepAllowed(
  currentStep: FormKitFrameworkContext,
  targetStep: FormKitFrameworkContext
): Promise<boolean> {
  if (currentStep === targetStep) return true
  const { allowIncomplete } = currentStep.node.parent?.props || {}
  const parentNode = currentStep.node.parent
  const currentStepIndex = parentNode?.props.steps.indexOf(currentStep)
  const targetStepIndex = parentNode?.props.steps.indexOf(targetStep)

  // check if there is a function for the stepChange guard
  const beforeStepChange =
    currentStep.node.props.beforeStepChange ||
    currentStep.node.parent?.props.beforeStepChange

  if (beforeStepChange && typeof beforeStepChange === 'function') {
    if (parentNode) {
      parentNode?.store.set(
        createMessage({
          key: 'loading',
          value: true,
          visible: false,
        })
      )
      parentNode.props.disabled = true
      currentStep.disabled = true
    }
    const result = await beforeStepChange({
      currentStep,
      targetStep,
      delta: targetStepIndex - currentStepIndex,
    })
    if (parentNode) {
      parentNode?.store.remove('loading')
      parentNode.props.disabled = false
      currentStep.disabled = false
    }
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
async function setActiveStep(targetStep: FormKitFrameworkContext, e?: Event) {
  if (e) {
    e.preventDefault()
  }
  if (targetStep && targetStep.node.name && targetStep.node.parent) {
    const currentStep = targetStep.node.parent.props.steps.find(
      (step: FormKitFrameworkContext) =>
        step.node.name === targetStep.node.parent?.props.activeStep
    )
    const stepIsAllowed = await isTargetStepAllowed(currentStep, targetStep)
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
async function incrementStep(
  delta: number,
  currentStep: FormKitFrameworkContextWithSteps
) {
  if (currentStep && currentStep.node.name && currentStep.node.parent) {
    const steps = currentStep.node.parent.props.steps
    const stepIndex = currentStep.stepIndex
    const targetStep = steps[stepIndex + delta]
    if (!targetStep) return
    const stepIsAllowed = await isTargetStepAllowed(currentStep, targetStep)

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
          (step) => !isPlaceholder(step) && step.name === node.props.activeStep
        ) as FormKitNode | undefined
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

function createSSRStepsFromTabs(tabs: Record<string, any>[]) {
  if (!tabs || !tabs.length) return []
  const placeholderTabs = tabs.map((tab: Record<string, any>, index) => {
    return {
      __isPlaceholder: true,
      stepName: tab.props?.label || camel2title(tab.props?.name),
      isFirstStep: index === 0,
      isLastStep: index === tabs.length - 1,
      isActiveStep: index === 0,
      node: {
        name: tab.props?.name,
      },
    }
  })
  return placeholderTabs
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
  let isFirstStep = true

  const multiStepPlugin = (node: FormKitNode) => {
    if (node.props.type === 'multi-step') {
      if (!node.context) return

      isFirstStep = true // reset variable, next step will be first step in multistep
      node.addProps(['steps', 'tabs', 'activeStep'])

      // call the default slot to pre-render child steps
      // for SSR support
      if (
        node.context.slots &&
        (node.context.slots as Record<string, () => any>).default
      ) {
        node.props.tabs = (
          node.context.slots as Record<string, () => any>
        ).default()
      }

      node.props.steps =
        node.props.steps || createSSRStepsFromTabs(node.props.tabs)
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

      node.context.handlers.triggerStepValidations = triggerStepValidations
      node.context.handlers.showStepErrors = showStepErrors

      node.on('created', () => {
        if (!node.context) return

        node.extend('next', {
          get: (node) => () => {
            incrementStep(
              1,
              node?.props?.steps.find(
                (step: Record<string, any>) => step.isActiveStep
              )
            )
          },
          set: false,
        })
        node.extend('previous', {
          get: (node) => () => {
            incrementStep(
              -1,
              node?.props?.steps.find(
                (step: Record<string, any>) => step.isActiveStep
              )
            )
          },
          set: false,
        })
        node.extend('goTo', {
          get: (node) => (target: number | string) => {
            if (typeof target === 'number') {
              const targetStep = node.props.steps[target]
              setActiveStep(targetStep)
            } else if (typeof target === 'string') {
              const targetStep = node.props.steps.find(
                (step: Record<string, any>) => step.node.name === target
              )
              setActiveStep(targetStep)
            }
          },
          set: false,
        })

        whenAvailable(
          `${node.props.id}`,
          (el) => {
            initEvents(node, el)
          },
          node.props.__root
        )
      })

      node.on('child', ({ payload: childNode }) => {
        // remove placeholder steps
        if (node.props.steps && node.props.steps.length) {
          node.props.steps = node.props.steps.filter(
            (step: Record<string, any>) => !step.__isPlaceholder
          )
        }
        node.props.steps =
          Array.isArray(node.props.steps) && node.props.steps.length > 0
            ? [...node.props.steps, childNode.context]
            : [childNode.context]
        node.props.steps = orderSteps(node, node.props.steps)
        setNodePositionProps(node.props.steps)

        childNode.props.stepName =
          childNode.props.label || camel2title(childNode.name)
        childNode.props.errorCount = 0
        childNode.props.blockingCount = 0
        childNode.props.isActiveStep = isFirstStep
        isFirstStep = false

        node.props.activeStep = node.props.activeStep
          ? node.props.activeStep
          : node.props.steps[0]
          ? node.props.steps[0].node.name
          : ''
      })

      node.on('prop:activeStep', ({ payload }) => {
        node.children.forEach((child) => {
          if (isPlaceholder(child)) return
          child.props.isActiveStep = child.name === payload
          if (isBrowser && child.name === payload) {
            const el = node.props.__root?.querySelector(
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
        childNode.props.ordered = false
        node.props.steps = node.props.steps.filter(
          (step: FormKitFrameworkContext, index: number) => {
            if (step.node.name !== childNode.name) {
              return true
            }
            removedStepIndex = index
            return false
          }
        )
        setNodePositionProps(node.props.steps)
        // if the child that was removed was the active step
        // then fallback to the next available step
        if (node.props.activeStep === childNode.name) {
          const targetIndex = removedStepIndex > 0 ? removedStepIndex - 1 : 0
          node.props.activeStep = node.props.steps[targetIndex]
            ? node.props.steps[targetIndex].node.name
            : ''
        }
      })
    }
    if (
      node.props.type === 'step' &&
      node.parent?.props.type === 'multi-step'
    ) {
      if (!node.context || !node.parent || !node.parent.context) return

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
      const parentNode = node.parent

      node.on('created', () => {
        if (!node.context || !parentNode.context) return

        whenAvailable(
          `${node.props.id}`,
          () => {
            parentNode.props.steps = orderSteps(node, parentNode.props.steps)
            setNodePositionProps(parentNode.props.steps)
          },
          node.props.__root
        )
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
          incrementStep(-1, node.context as FormKitFrameworkContextWithSteps)
      }

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
