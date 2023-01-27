import { FormKitNode, FormKitPlugin, createMessage } from '@formkit/core'
import { multiStep, step } from './schema'

interface MultiStepOptions {
  flattenSteps?: boolean
  allowIncomplete?: boolean
}

function setNodePositionProps(steps: FormKitNode[]) {
  steps.forEach((step: FormKitNode, index: number) => {
    step.props.isFirstStep = index === 0
    step.props.isLastStep = index === steps.length - 1
    step.props.stepIndex = index
    step.props.steps = steps
  })
}

function setActiveStep(targetStep: FormKitNode) {
  if (targetStep && targetStep.name && targetStep.parent) {
    const currentStep = targetStep.parent.props.steps.find(
      (step: FormKitNode) => step.name === targetStep.parent?.props.activeStep
    )
    const stepIsValid = validateStep(currentStep)

    if (stepIsValid) {
      targetStep.parent.props.activeStep = targetStep.name
    }
  }
}

function changeStep(delta: number, step: FormKitNode) {
  if (step && step.name && step.parent) {
    const { steps, stepIndex } = step.props
    const nextStep = steps[stepIndex + delta]
    const stepIsValid = validateStep(step)

    if (nextStep && stepIsValid) {
      step.parent.props.activeStep = nextStep.name
    }
  }
}

function validateStep(step: FormKitNode) {
  step.walk((n) => {
    n.store.set(
      createMessage({
        key: 'submitted',
        value: true,
        visible: false,
      })
    )
  })
  return step.context?.state.valid || step.parent?.props.allowIncomplete
}

export function createMultiStepPlugin(
  options?: MultiStepOptions
): FormKitPlugin {
  console.log(options)

  const multiStepPlugin = (node: FormKitNode) => {
    if (!['multi-step', 'step'].includes(node.props.type)) return

    if (node.props.type === 'multi-step') {
      node.addProps(['steps', 'activeStep', 'flattenValues', 'allowIncomplete'])

      node.on('created', () => {
        if (!node.context) return
        node.context.handlers.validateStep = validateStep
        node.props.flattenValues = options?.flattenSteps || false
        node.props.allowIncomplete = options?.allowIncomplete || false
      })

      node.on('childRemoved', ({ payload: childNode }) => {
        let removedStepIndex = -1
        node.props.steps = node.props.steps.filter(
          (step: FormKitNode, index: number) => {
            if (step.name !== childNode.name) {
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
            ? node.props.steps[targetIndex].name
            : ''
        }

        // recompute step positions
        setNodePositionProps(node.props.steps)
      })
    }
    if (
      node.props.type === 'step' &&
      node.parent?.props.type === 'multi-step'
    ) {
      node.addProps(['isActiveStep', 'isFirstStep', 'isLastStep'])
      node.on('created', () => {
        if (!node.context) return
        if (node.parent && node.parent.context) {
          const parentNode = node.parent
          parentNode.props.steps = Array.isArray(parentNode.props.steps)
            ? [...parentNode.props.steps, node]
            : [node]

          setNodePositionProps(parentNode.props.steps)

          parentNode.props.activeStep = parentNode.props.activeStep
            ? parentNode.props.activeStep
            : parentNode.props.steps[0]
            ? parentNode.props.steps[0].name
            : ''

          if (parentNode.context) {
            parentNode.context.handlers.setActiveStep = (
              stepNode: FormKitNode
            ) => setActiveStep.bind(null, stepNode)
            node.context.handlers.changeStep = (delta, stepNode: FormKitNode) =>
              changeStep.bind(null, delta, stepNode)
          }
        }
      })

      node.parent.on('prop:activeStep', ({ payload }) => {
        node.props.isActiveStep = node.name === payload
      })
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
