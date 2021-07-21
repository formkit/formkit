import { FormKitNode } from '@formkit/core'
import { has } from '@formkit/utils'

/**
 * Special validation properties that affect the way validations are applied.
 */
interface FormKitValidationHints {
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
  (value: any, ...args: any[]): boolean
} & Partial<FormKitValidationHints>

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
    const rules = Object.assign(
      {},
      baseRules,
      node.props.validationRules as FormKitValidationRules
    )
    // We only parse the validation rules when the node is created and when the
    // node's validation prop is updated.
    parseRules(node.props.validation, rules)
    // node.on('prop.has(name, validation)', () => {

    // })

    node.on('commit', ({ payload }) => {
      console.log(payload)
    })
  }
}

/**
 * Regular expression for extracting rule data.
 */
const rulePattern = /^([!a-zA-Z0-9_]+)(?:\:(.*)+)?$/i

/**
 * Validation hints are special characters preceding a validation rule, like
 * !phone
 */
const hintPattern = /^([!]+)([a-zA-Z0-9_]+)$/i

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
    const defaultHints: FormKitValidationHints = {
      force: false,
      skipEmpty: true,
    }
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
 */
function parseRule(rule: string): FormKitValidationIntent | false {
  const trimmed = rule.trim()
  if (trimmed) {
    const matches = trimmed.match(rulePattern)
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
  const matches = ruleName.match(hintPattern)
  if (!matches) {
    return [ruleName, {}]
  }
  const map: { [index: string]: Partial<FormKitValidationHints> } = {
    '!': { force: true },
  }
  return [
    matches[2],
    matches[1]
      .split('')
      .reduce((hints: Partial<FormKitValidationHints>, hint: string) => {
        if (has(map, hint)) {
          return Object.assign(hints, map[hint])
        }
        return hints
      }, {} as Partial<FormKitValidationHints>),
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
  return ['skipEmpty', 'force'].reduce(
    (hints: Partial<FormKitValidationHints>, hint: string) => {
      if (has(rule, hint) && !has(hints, hint)) {
        hints[hint as keyof FormKitValidationHints] =
          rule[hint as keyof FormKitValidationHints]
      }
      return hints
    },
    existingHints
  )
}
