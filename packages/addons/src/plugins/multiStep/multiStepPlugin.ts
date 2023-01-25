import { FormKitNode, FormKitPlugin } from '@formkit/core'
import { multiStepSchema, stepSchema } from './schema'

interface MultiStepOptions {
  flattenSteps?: boolean
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
      })
    }
    if (
      node.props.type === 'step' &&
      node.parent?.props.type === 'multi-step'
    ) {
      node.addProps(['isActiveStep'])
      node.on('created', () => {
        if (!node.context) return
        if (node.parent && node.parent.context) {
          const parentNode = node.parent
          parentNode.props.steps = Array.isArray(parentNode.props.steps)
            ? [...parentNode.props.steps, node]
            : [node]

          parentNode.props.activeStep = parentNode.props.activeStep
            ? parentNode.props.activeStep
            : parentNode.props.steps[0]
            ? parentNode.props.steps[0].name
            : ''

          console.log(parentNode.props.activeStep)

          if (parentNode.context) {
            parentNode.context.handlers.setActiveStep =
              (step: FormKitNode) => () => {
                parentNode.props.activeStep = step.name
              }
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
        return node.define({
          type: 'group',
          schema: multiStepSchema,
          props: ['flattenValues', 'allowIncompleteAdvance'],
        })
      case 'step':
        const isInvalid =
          !node.parent || node.parent.props.type !== 'multi-step'
        if (isInvalid) {
          console.warn(
            'Invalid use of <FormKit type="step">. <FormKit type="step"> should be an immediate child of a <FormKit type="multi-step"> element.'
          )
        }
        return node.define({
          type: 'group',
          schema: isInvalid ? [] : stepSchema,
        })
    }
  }

  return multiStepPlugin
}
