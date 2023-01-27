import { FormKitNode, FormKitPlugin } from '@formkit/core'
import { multiStep, step } from './schema'

interface MultiStepOptions {
  flattenSteps?: boolean
}

function setNodePositionProps(steps: FormKitNode[]) {
  steps.forEach((step: FormKitNode, index: number) => {
    step.props.isFirstStep = index === 0
    step.props.isLastStep = index === steps.length - 1
    step.props.stepIndex = index
    step.props.steps = steps
  })
}

function setActiveStep(step: FormKitNode) {
  if (step && step.name && step.parent) {
    step.parent.props.activeStep = step.name
  }
}

function prevStep(step: FormKitNode) {
  if (step && step.name && step.parent) {
    const { steps, stepIndex } = step.props
    const prevStep = steps[stepIndex - 1]
    if (prevStep) {
      step.parent.props.activeStep = prevStep.name
    }
  }
}

function nextStep(step: FormKitNode) {
  if (step && step.name && step.parent) {
    const { steps, stepIndex } = step.props
    const nextStep = steps[stepIndex + 1]
    if (nextStep) {
      step.parent.props.activeStep = nextStep.name
    }
  }
}

export function createMultiStepPlugin(
  options?: MultiStepOptions
): FormKitPlugin {
  console.log(options)

  const multiStepPlugin = (node: FormKitNode) => {
    if (!['multi-step', 'step'].includes(node.props.type)) return

    if (node.props.type === 'multi-step') {
      node.addProps(['steps', 'activeStep'])

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
            node.context.handlers.nextStep = nextStep.bind(null, node)
            node.context.handlers.prevStep = prevStep.bind(null, node)
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
