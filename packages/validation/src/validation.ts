import type { FormKitNode, FormKitMessage} from '@formkit/core';
import { createMessage } from '@formkit/core'
import type { FormKitObservedNode, FormKitDependencies } from '@formkit/observer';
import {
  createObserver,
  applyListeners,
  diffDeps,
  removeListeners,
  isKilled,
} from '@formkit/observer'
import { has, empty, token, clone, cloneAny, eq } from '@formkit/utils'

/**
 * Special validation properties that affect the way validations are applied.
 */
interface FormKitValidationHints {
  /**
   * If this validation fails, should it block the form from being submitted or
   * considered "valid"? There are some cases where it is acceptable to allow
   * an incorrect value to still be allowed to submit.
   */
  blocking: boolean
  /**
   * Only run this rule after this many milliseconds of debounce. This is
   * particularity helpful for more "expensive" async validation rules like
   * checking if a username is taken from the backend.
   */
  debounce: number
  /**
   * Normally the first validation rule to fail blocks other rules from running
   * if this flag is flipped to true, this rule will be run every time even if
   * a previous rule in the validation stack failed.
   */
  force: boolean
  /**
   * Most validation rules are not run when the input is empty, but this flag
   * allows that behavior to be changed.
   */
  skipEmpty: boolean
  /**
   * The actual name of the validation rule.
   */
  name: string
}

/**
 * Defines what fully parsed validation rules look like.
 * @public
 */
export type FormKitValidation = {
  /**
   * The actual rule function that will be called
   */
  rule: FormKitValidationRule
  /**
   * Arguments to be passed to the validation rule
   */
  args: any[]
  /**
   * The debounce timer for this input.
   */
  timer: number
  /**
   * The state of a validation, can be true, false, or null which means unknown.
   */
  state: boolean | null
  /**
   * Determines if the rule should be considered for the next run cycle. This
   * does not mean the rule will be validated, it just means that it should be
   * considered.
   */
  queued: boolean
  /**
   * Dependencies this validation rule is observing.
   */
  deps: FormKitDependencies
} & FormKitValidationHints

/**
 * Defines what validation rules look like when they are parsed, but have not
 * necessarily had validation rules substituted in yet.
 * @public
 */
export type FormKitValidationIntent = [string | FormKitValidationRule, ...any[]]

/**
 * Signature for a generic validation rule. It accepts an input, often a string
 * but validation rules should be able to accept any input type, and returns a
 * boolean indicating whether or not it passed validation.
 * @public
 */
export type FormKitValidationRule = {
  (node: FormKitNode, ...args: any[]): boolean | Promise<boolean>
  ruleName?: string
} & Partial<FormKitValidationHints>

/**
 * A validation rule result.
 * @public
 */
export interface FormKitValidationRuleResult {
  result: boolean
  validation: FormKitValidation
}

/**
 * FormKit validation rules are structured as on object of key/function pairs
 * where the key of the object is the validation rule name.
 * @public
 */
export interface FormKitValidationRules {
  [index: string]: FormKitValidationRule
}

/**
 * The interface for the localized validation message registry.
 * @public
 */
export interface FormKitValidationMessages {
  [index: string]: string | ((...args: FormKitValidationI18NArgs) => string)
}

/**
 * Determines the validation nonce.
 * @public
 */
interface FormKitValidationState {
  input: string | null
  rerun: number | null
  isPassing: boolean
}

/**
 * The arguments that are passed to the validation messages in the i18n plugin.
 * @public
 */
type FormKitValidationI18NArgs = [
  {
    node: FormKitNode
    name: string
    args: any[]
    message?: string
  }
]

/**
 * Message that gets set when the node is awaiting validation.
 */
const validatingMessage = createMessage({
  type: 'state',
  blocking: true,
  visible: false,
  value: true,
  key: 'validating',
})

/**
 * The actual validation plugin function, everything must be bootstrapped here.
 * @param node - The node to bind validation to.
 * @public
 */
export function createValidationPlugin(baseRules: FormKitValidationRules = {}) {
  return function validationPlugin(node: FormKitNode): void {
    let availableRules = {
      ...baseRules,
      ...cloneAny(node.props.validationRules),
    }
    // create an observed node
    let observedNode = createObserver(node)
    const state = { input: token(), rerun: null, isPassing: true }
    let validation = cloneAny(node.props.validation)
    // If the node's validation props change, reboot:
    node.on('prop:validation', ({ payload }) => reboot(payload, availableRules))
    node.on('prop:validationRules', ({ payload }) =>
      reboot(validation, payload)
    )
    /**
     * Reboots the validation using new rules or declarations/intents.
     * @param newValidation - New validation declaration to use
     * @param newRules - New validation rules to use
     * @returns
     */
    function reboot(
      newValidation: undefined | string | FormKitValidationIntent[],
      newRules: FormKitValidationRules
    ) {
      if (eq(availableRules, newRules) && eq(validation, newValidation)) return
      validation = cloneAny(newValidation)
      availableRules = { ...baseRules, ...cloneAny(node.props.validationRules) }
      // Destroy all observers that may re-trigger validation on an old stack
      removeListeners(observedNode.receipts)
      // Remove all existing messages before re-validating
      node.store.filter(() => false, 'validation')
      node.props.parsedRules = parseRules(newValidation, availableRules)
      observedNode.kill()
      observedNode = createObserver(node)
      validate(observedNode, node.props.parsedRules, state)
    }

    // Validate the field when this plugin is initialized
    node.props.parsedRules = parseRules(validation, availableRules)
    validate(observedNode, node.props.parsedRules, state)
  }
}

/**
 * Given parsed validations, a value and a node, run the validations and set
 * the appropriate store messages on the node.
 * @param value - The value being validated
 * @param node - The Node this value belongs to
 * @param rules - The rules
 */
function validate(
  node: FormKitObservedNode,
  validations: FormKitValidation[],
  state: FormKitValidationState
) {
  if (isKilled(node)) return
  state.input = token()
  state.isPassing = true
  node.store.filter((message) => !message.meta.removeImmediately, 'validation')
  validations.forEach(
    (validation) => validation.debounce && clearTimeout(validation.timer)
  )
  if (validations.length) {
    node.store.set(validatingMessage)
    run(0, validations, node, state, false, () => {
      node.store.remove(validatingMessage.key)
    })
  }
}

/**
 * Runs validation rules recursively while collecting dependencies allowing for
 * cross-node validation rules that automatically re-trigger when a foreign
 * value is changed.
 * @param current - The index of the current validation rule
 * @param validations - The remaining validation rule stack to run
 * @param node - An observed node, the owner of this validation stack
 * @param state - An object of state information about this run
 * @param removeImmediately - Should messages created during this call be removed immediately when a new commit takes place?
 * @returns
 */
function run(
  current: number,
  validations: FormKitValidation[],
  node: FormKitObservedNode,
  state: FormKitValidationState,
  removeImmediately: boolean,
  complete: () => void
): void {
  const validation = validations[current]
  if (!validation) return complete()
  const currentRun = state.input
  validation.state = null

  function next(async: boolean, result: boolean | null): void {
    state.isPassing = state.isPassing && !!result
    validation.queued = false
    const newDeps = node.stopObserve()
    applyListeners(node, diffDeps(validation.deps, newDeps), () => {
      validation.queued = true
      if (state.rerun) clearTimeout(state.rerun)
      state.rerun = setTimeout(
        validate,
        0,
        node,
        validations,
        state
      ) as unknown as number
    })
    validation.deps = newDeps

    if (state.input === currentRun) {
      validation.state = result
      if (result === false) {
        createFailedMessage(node, validation, removeImmediately || async)
      } else {
        removeMessage(node, validation)
      }
      if (validations.length > current + 1) {
        run(
          current + 1,
          validations,
          node,
          state,
          removeImmediately || async,
          complete
        )
      } else {
        // The validation has completed
        complete()
      }
    }
  }

  if (
    (!empty(node.value) || !validation.skipEmpty) &&
    (state.isPassing || validation.force)
  ) {
    if (validation.queued) {
      runRule(validation, node, (result: boolean | Promise<boolean>) => {
        result instanceof Promise
          ? result.then((r) => next(true, r))
          : next(false, result)
      })
    } else {
      // In this case our rule is not queued, so literally nothing happened that
      // would affect it, we just need to move past this rule and make no
      // modifications to state
      run(current + 1, validations, node, state, removeImmediately, complete)
    }
  } else {
    // This rule is not being run because either:
    //  1. The field is empty and this rule should not run when empty
    //  2. A previous validation rule is failing and this one is not forced
    // In this case we should call next validation.
    if (empty(node.value) && validation.skipEmpty && state.isPassing) {
      // This node has an empty value so its validation was skipped. So we
      // need to queue it up, we do that by starting an observation and just
      // touching the value attribute.
      node.observe()
      node.value
      // Because this validation rule is skipped when the node's value is empty
      // so we keep the current value `state.isPassing` to the next rule execution
      // if we pass null it will be typecasted to false and all following rules
      // will be ignored including `required` rule which cause odds behavior
      next(false, state.isPassing)
    } else {
      next(false, null)
    }
  }
}

/**
 * Run a validation rule debounced or not.
 * @param validation - A validation to debounce
 */
function runRule(
  validation: FormKitValidation,
  node: FormKitObservedNode,
  after: (result: boolean | Promise<boolean>) => void
) {
  if (validation.debounce) {
    validation.timer = setTimeout(() => {
      node.observe()
      after(validation.rule(node, ...validation.args))
    }, validation.debounce) as unknown as number
  } else {
    node.observe()
    after(validation.rule(node, ...validation.args))
  }
}

/**
 * The messages given to this function have already been set on the node, but
 * any other validation messages on the node that are not included in this
 * stack should be removed because they have been resolved.
 * @param node - The node to operate on.
 * @param messages - A new stack of messages
 */
function removeMessage(node: FormKitNode, validation: FormKitValidation) {
  const key = `rule_${validation.name}`
  if (has(node.store, key)) {
    node.store.remove(key)
  }
}

/**
 *
 * @param value - The value that is failing
 * @param validation - The validation object
 */
function createFailedMessage(
  node: FormKitNode,
  validation: FormKitValidation,
  removeImmediately: boolean
): FormKitMessage {
  const i18nArgs: FormKitValidationI18NArgs = createI18nArgs(node, validation)
  const customMessage = createCustomMessage(node, validation, i18nArgs)
  // Here we short circuit the i18n system to force the output.
  const message = createMessage({
    blocking: validation.blocking,
    key: `rule_${validation.name}`,
    meta: {
      /**
       * Use this key instead of the message root key to produce i18n validation
       * messages.
       */
      messageKey: validation.name,
      /**
       * For messages that were created *by or after* a debounced or async
       * validation rule — we make note of it so we can immediately remove them
       * as soon as the next commit happens.
       */
      removeImmediately,
      /**
       * Determines if this message should be passed to localization.
       */
      localize: !customMessage,
      /**
       * The arguments that will be passed to the validation rules
       */
      i18nArgs,
    },
    type: 'validation',
    value: customMessage || 'This field is not valid.',
  })
  node.store.set(message)
  return message
}

/**
 * Returns a custom validation message if applicable.
 * @param node - FormKit Node
 * @param validation - The validation rule being processed.
 */
function createCustomMessage(
  node: FormKitNode,
  validation: FormKitValidation,
  i18nArgs: FormKitValidationI18NArgs
): string | undefined {
  const customMessage =
    node.props.validationMessages &&
    has(node.props.validationMessages, validation.name)
      ? node.props.validationMessages[validation.name]
      : undefined
  if (typeof customMessage === 'function') {
    return customMessage(...i18nArgs)
  }
  return customMessage
}

/**
 * Creates the arguments passed to the i18n
 * @param node - The node that performed the validation
 * @param validation - The validation that failed
 */
function createI18nArgs(
  node: FormKitNode,
  validation: FormKitValidation
): FormKitValidationI18NArgs {
  // If a custom message has been found, short circuit the i18n system.
  return [
    {
      node,
      name: createMessageName(node),
      args: validation.args,
    },
  ]
}

/**
 * The name used in validation messages.
 * @param node - The node to display
 * @returns
 */
function createMessageName(node: FormKitNode): string {
  if (typeof node.props.validationLabel === 'function') {
    return node.props.validationLabel(node)
  }
  return (
    node.props.validationLabel ||
    node.props.label ||
    node.props.name ||
    String(node.name)
  )
}

/**
 * Describes hints, must also be changed in the debounceExtractor.
 */
const hintPattern = '(?:[\\*+?()0-9]+)'

/**
 * A pattern to describe rule names. Rules names can only contain letters,
 * numbers, and underscores and must start with a letter.
 */
const rulePattern = '[a-zA-Z][a-zA-Z0-9_]+'

/**
 * Regular expression for extracting rule data.
 */
const ruleExtractor = new RegExp(
  `^(${hintPattern}?${rulePattern})(?:\\:(.*)+)?$`,
  'i'
)

/**
 * Validation hints are special characters preceding a validation rule, like
 * !phone
 */
const hintExtractor = new RegExp(`^(${hintPattern})(${rulePattern})$`, 'i')

/**
 * Given a hint string like ^(200)? or ^? or (200)?^ extract the hints to
 * matches.
 */
const debounceExtractor = /([\*+?]+)?(\(\d+\))([\*+?]+)?/

/**
 * Determines if a given string is in the proper debounce format.
 */
const hasDebounce = /\(\d+\)/

/**
 * The default values of the available validation hints.
 */
export const defaultHints: FormKitValidationHints = {
  blocking: true,
  debounce: 0,
  force: false,
  skipEmpty: true,
  name: '',
}

/**
 * Parse validation intents and strings into validation rule stacks.
 * @param validation - Either a string a validation rules, or proper array of structured rules.
 * @internal
 */
export function parseRules(
  validation: undefined | string | FormKitValidationIntent[],
  rules: FormKitValidationRules
): FormKitValidation[] {
  if (!validation) return []
  const intents =
    typeof validation === 'string'
      ? extractRules(validation)
      : clone(validation)
  return intents.reduce((validations, args) => {
    let rule = args.shift() as string | FormKitValidationRule
    const hints = {}
    if (typeof rule === 'string') {
      const [ruleName, parsedHints] = parseHints(rule)
      if (has(rules, ruleName)) {
        rule = rules[ruleName]
        Object.assign(hints, parsedHints)
      }
    }
    if (typeof rule === 'function') {
      validations.push({
        rule,
        args,
        timer: 0,
        state: null,
        queued: true,
        deps: new Map(),
        ...defaultHints,
        ...fnHints(hints, rule),
      })
    }
    return validations
  }, [] as FormKitValidation[])
}

/**
 * A string of validation rules written in FormKitRule notation.
 * @param validation - The string of rules
 * @internal
 */
function extractRules(validation: string): FormKitValidationIntent[] {
  return validation.split('|').reduce((rules, rule) => {
    const parsedRule = parseRule(rule)
    if (parsedRule) {
      rules.push(parsedRule)
    }
    return rules
  }, [] as FormKitValidationIntent[])
}

/**
 * Given a rule like confirm:password_confirm produce a FormKitValidationIntent
 * @param rule - A string representing a validation rule.
 * @returns
 */
function parseRule(rule: string): FormKitValidationIntent | false {
  const trimmed = rule.trim()
  if (trimmed) {
    const matches = trimmed.match(ruleExtractor)
    if (matches && typeof matches[1] === 'string') {
      const ruleName = matches[1].trim()
      const args =
        matches[2] && typeof matches[2] === 'string'
          ? matches[2].split(',').map((s) => s.trim())
          : []
      return [ruleName, ...args]
    }
  }
  return false
}

/**
 * Given a rule name, detect if there are any additional hints like !
 * @param ruleName - string representing a rule name
 * @returns
 */
function parseHints(
  ruleName: string
): [string, Partial<FormKitValidationHints>] {
  const matches = ruleName.match(hintExtractor)
  if (!matches) {
    return [ruleName, { name: ruleName }]
  }
  const map: { [index: string]: Partial<FormKitValidationHints> } = {
    '*': { force: true },
    '+': { skipEmpty: false },
    '?': { blocking: false },
  }
  const [, hints, rule] = matches
  const hintGroups = hasDebounce.test(hints)
    ? hints.match(debounceExtractor) || []
    : [, hints]
  return [
    rule,
    [hintGroups[1], hintGroups[2], hintGroups[3]].reduce(
      (hints: Partial<FormKitValidationHints>, group: string | undefined) => {
        if (!group) return hints
        if (hasDebounce.test(group)) {
          hints.debounce = parseInt(group.substr(1, group.length - 1))
        } else {
          group
            .split('')
            .forEach(
              (hint) => has(map, hint) && Object.assign(hints, map[hint])
            )
        }
        return hints
      },
      { name: rule } as Partial<FormKitValidationHints>
    ),
  ]
}

/**
 * Extracts hint properties from the validation rule function itself and applies
 * them if they are not already in the set of validation hints extracted from
 * strings.
 * @param existingHints - An existing set of hints already parsed
 * @param rule - The actual rule function, which can contain hint properties
 * @returns
 */
function fnHints(
  existingHints: Partial<FormKitValidationHints>,
  rule: FormKitValidationRule
) {
  if (!existingHints.name) {
    existingHints.name = rule.ruleName || rule.name
  }
  return ['skipEmpty', 'force', 'debounce', 'blocking'].reduce(
    (hints: Partial<FormKitValidationHints>, hint: string) => {
      if (has(rule, hint) && !has(hints, hint)) {
        Object.assign(hints, {
          [hint]: rule[hint as keyof FormKitValidationHints],
        })
      }
      return hints
    },
    existingHints
  )
}

/**
 * Extracts all validation messages from the given node and all its descendants.
 * This is not reactive and must be re called each time the messages change.
 * @param node - The FormKit node to extract validation rules from — as well as its descendants.
 * @public
 */
export function getValidationMessages(
  node: FormKitNode
): Map<FormKitNode, FormKitMessage[]> {
  const messages: Map<FormKitNode, FormKitMessage[]> = new Map()
  const extract = (n: FormKitNode) => {
    const nodeMessages = []
    for (const key in n.store) {
      const message = n.store[key]
      if (
        message.type === 'validation' &&
        message.blocking &&
        message.visible &&
        typeof message.value === 'string'
      ) {
        nodeMessages.push(message)
      }
    }
    if (nodeMessages.length) {
      messages.set(n, nodeMessages)
    }
    return n
  }
  extract(node).walk(extract)
  return messages
}
