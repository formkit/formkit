import { FormKitNode, FormKitMessage, createMessage } from '@formkit/core'
import { has, empty, token } from '@formkit/utils'

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
} & FormKitValidationHints

/**
 * Defines what validation rules look like when they are parsed, but have not
 * necessarily had validation rules substituted in yet.
 * @public
 */
export type FormKitValidationIntent = [string | FormKitValidationRule, ...any[]]

/**
 * Validation rules are called with the first argument being a context object
 * containing the input's value.
 * @public
 */
export interface FormKitValidationRuleContext {
  value: any
}

/**
 * Signature for a generic validation rule. It accepts an input, often a string
 * but validation rules should be able to accept any input type, and returns a
 * boolean indicating whether or not it passed validation.
 * @public
 */
export type FormKitValidationRule = {
  (context: FormKitValidationRuleContext, ...args: any[]):
    | boolean
    | Promise<boolean>
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
 * The actual validation plugin function, everything must be bootstrapped here.
 * @param node - The node to bind validation to.
 */
export function createValidation(baseRules: FormKitValidationRules = {}) {
  return function plugin(node: FormKitNode): void {
    const availableRules = Object.assign(
      {},
      baseRules,
      node.props.validationRules as FormKitValidationRules
    )
    // Parse the rules on creation:
    let rules = parseRules(node.props.validation, availableRules)
    const nonce = { value: token() }
    // If the node's validation prop changes, update the rules:
    node.on('prop', (event) => {
      if (event.payload.prop === 'validation') {
        rules = parseRules(event.payload.value, availableRules)
      }
    })
    // Validate the field when this plugin is initialized
    validate(node.value, node, rules, nonce)
    // When values of this input are actually committed, run validation:
    node.on('commit', ({ payload }) => validate(payload, node, rules, nonce))
  }
}

/**
 * Given parsed validations, a value and a node, run the validations and set
 * the appropriate store messages on the node.
 * @param value - The value being validated
 * @param node - The Node this value belongs to
 * @param rules - The rules
 */
async function validate(
  value: any,
  node: FormKitNode<any>,
  rules: FormKitValidation[],
  nonce: { value: string }
): Promise<void> {
  // Create a new nonce, canceling any existing async validators
  nonce.value = token()
  let validations = [...rules]
  removeFlaggedMessages(node)
  validations.forEach((v) => v.debounce && clearTimeout(v.timer))
  if (empty(value)) {
    validations = validations.filter((v) => !v.skipEmpty)
  }
  if (validations.length) {
    await run(value, validations, node, nonce, false)
  }
}

/**
 * Recursively run validation rules creating messages as we go, the return value
 * is a promise that resolves to either false or a stack of messages that were
 * set on the node.
 * @param value - The value of the input
 * @param validations - The remaining validation rule stack to run
 * @param nonce - An object-referenced nonce that can act as a semaphore
 * @param messages - A collection of messages that were added to the node
 * @param removeImmediately - Should messages created during this call be removed immediately when a new commit takes place?
 * @returns
 */
async function run(
  value: any,
  validations: FormKitValidation[],
  node: FormKitNode<any>,
  nonce: { value: string },
  removeImmediately: boolean
): Promise<void | 0> {
  const currentRun = nonce.value
  const validation = validations.shift()
  if (!validation) return
  if (validation.debounce) {
    removeImmediately = true
    await debounce(validation)
  }
  const willBeResult = validation.rule({ value }, ...validation.args)
  const isAsync = willBeResult instanceof Promise
  const result = isAsync ? await willBeResult : willBeResult
  // The input has been edited since we started validating — kill the stack
  if (currentRun !== nonce.value) return
  // Async messages need to be trashed immediately.
  if (!removeImmediately && isAsync) removeImmediately = true
  if (!result) {
    createFailedMessage(node, value, validation, removeImmediately)
    // The rule failed so filter out any remaining rules that are not forced
    validations = validations.filter((v) => v.force)
  } else {
    removeMessage(node, validation)
  }
  return (
    validations.length &&
    (await run(value, validations, node, nonce, removeImmediately))
  )
}

/**
 * Create a promise that waits for a void timeout for a validation rule.
 * @param validation - A validation to debounce
 */
function debounce(validation: FormKitValidation) {
  return new Promise<void>((r) => {
    validation.timer = (setTimeout(
      () => r(),
      validation.debounce
    ) as unknown) as number
  })
}

/**
 * The messages given to this function have already been set on the node, but
 * any other validation messages on the node that are not included in this
 * stack should be removed because they have been resolved.
 * @param node - The node to operate on.
 * @param messages - A new stack of messages
 */
function removeMessage(node: FormKitNode<any>, validation: FormKitValidation) {
  const key = `rule_${validation.name}`
  if (has(node.store, key)) {
    node.store.remove(key)
  }
}

/**
 * Remove any messages that were flagged for immediate removal on a new
 * validation cycle.
 * @param node - The node to operate on
 */
function removeFlaggedMessages(node: FormKitNode<any>) {
  node.store.filter((message) => !message.meta.removeImmediately, 'validation')
}

/**
 *
 * @param value - The value that is failing
 * @param validation - The validation object
 */
function createFailedMessage(
  node: FormKitNode<any>,
  _value: any,
  validation: FormKitValidation,
  removeImmediately: boolean
): FormKitMessage {
  const message = createMessage({
    blocking: validation.blocking,
    key: `rule_${validation.name}`,
    meta: {
      /**
       * For messages that were created *by or after* a debounced or async
       * validation rule — we make note of it so we can immediately remove them
       * as soon as the next commit happens.
       */
      removeImmediately,
    },
    type: 'validation',
    value: 'Invalid',
  })
  node.store.set(message)
  return message
}

/**
 * Describes hints
 */
const hintPattern = '(?:[\\^?()0-9]+)'

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
const debounceExtractor = /([\^?]+)?(\(\d+\))([\^?]+)?/

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
    typeof validation === 'string' ? extractRules(validation) : validation
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
    '^': { force: true },
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
  return ['skipEmpty', 'force', 'debounce'].reduce(
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
