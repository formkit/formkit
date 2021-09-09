import { has } from '@formkit/utils'
import { FormKitNode, FormKitProps } from '@formkit/core'

/**
 * Properties available in all schema nodes.
 * @public
 */
export interface FormKitSchemaProps {
  value?: any
  children?: string | FormKitSchemaNode[]
  content?: string | FormKitSchemaNode[]
  key?: string
  $if?: string
}

/**
 * Properties available when using a formkit input.
 * @public
 */
export type FormKitSchemaFormKitNode = {
  $node: string
  name?: string
  props: Partial<FormKitProps>
  type: 'input' | 'list' | 'group'
  value?: any
} & FormKitSchemaProps

/**
 * Properties available when using a DOM node.
 * @public
 */
export type FormKitSchemaDOMNode = {
  $el: string
  attrs?: FormKitSchemaAttributes
} & FormKitSchemaProps

/**
 * A simple text node.
 * @public
 */
export type FormKitSchemaTextNode = string

/**
 * DOM attributes are simple string dictionaries.
 * @public
 */
export type FormKitSchemaAttributes = {
  style?: { [index: string]: string | number }
  [index: string]:
    | string
    | number
    | boolean
    | undefined
    | { [index: string]: string | number }
}

/**
 * Properties available when defining a generic non-formkit component.
 * @public
 */
export type FormKitSchemaComponent = {
  $cmp: string
  props?: { [index: string]: any }
} & FormKitSchemaProps

/**
 * The context that is passed from one schema render to the next.
 * @public
 */
export type FormKitSchemaContext<ComponentType> = {
  library: {
    [index: string]: ComponentType
  }
  nodes: {
    [index: string]: FormKitNode<any>
  }
}

/**
 * Properties available then defining a schema node.
 * @public
 */
export type FormKitSchemaNode =
  | FormKitSchemaFormKitNode
  | FormKitSchemaDOMNode
  | FormKitSchemaComponent
  | FormKitSchemaTextNode

/**
 * Logical operations are always a left/right fn
 */
type LogicOperator = (l: any, r: any) => boolean

/**
 * A set of logical operators used for parsing string logic.
 * @internal
 */
interface LogicOperators {
  [index: string]: LogicOperator
}

/**
 * Type narrow that a node is a DOM node.
 * @param node - A schema node to check
 * @returns
 * @public
 */
export function isDOM(node: FormKitSchemaNode): node is FormKitSchemaDOMNode {
  return typeof node !== 'string' && has(node, '$el')
}

/**
 * Determines if t a node is a $formkit schema node.
 * @param node - A schema node to check
 * @returns
 * @public
 */
export function isNode(
  node: FormKitSchemaNode
): node is FormKitSchemaFormKitNode {
  return typeof node !== 'string' && has(node, '$node')
}

/**
 * Determines if a node is conditionally rendered or not.
 * @param node - A schema node to check
 * @returns
 * @public
 */
export function isConditional(node: FormKitSchemaNode): boolean {
  if (typeof node === 'string') return false
  if (has(node, '$if')) {
    return true
  }
  return false
}

/**
 * Expands the current value if it is a function.
 * @param operand - A left or right hand operand
 * @returns
 */
const x = function expand(operand: any): any {
  return typeof operand === 'function' ? operand() : operand
}

/**
 * Comprehensive list of logical and comparison operators. This list MUST be
 * ordered by the length of the operator characters in descending order.
 */
const operators: LogicOperators = {
  '&&': (l, r) => x(l) && x(r),
  '||': (l, r) => x(l) || x(r),
  '==': (l, r) => x(l) == x(r),
  '!=': (l, r) => x(l) != x(r),
  '>=': (l, r) => x(l) >= x(r),
  '<=': (l, r) => x(l) <= x(r),
  '>': (l, r) => x(l) > x(r),
  '<': (l, r) => x(l) < x(r),
}

/**
 * Determines if the current character is the start of an operator symbol, if it
 * is, it returns that symbol.
 * @param symbols - An array of symbols that are considered operators
 * @param char - The current character being operated on
 * @param p - The position of the pointer
 * @param expression - The full string expression
 * @returns
 */
function getOp(
  symbols: string[],
  char: string,
  p: number,
  expression: string
): false | undefined | string {
  const candidates = symbols.filter((s) => s.startsWith(char))
  if (!candidates.length) return false
  return candidates.find((symbol) => {
    if (expression.length >= p + symbol.length) {
      const nextChars = expression.substr(p, symbol.length)
      if (nextChars === symbol) return symbol
    }
    return false
  })
}

/**
 * Parse a string expression into a function that returns a boolean. This is
 * the magic behind schema logic like $if.
 * @param expression - A string expression to parse
 * @returns
 */
export function parseLogicals(expression: string): () => boolean {
  const length = expression.length
  const symbols = Object.keys(operators)
  let depth = 0
  let quote: false | string = false
  let op: null | ((l: any, r: any) => boolean) = null
  let operand: string | (() => boolean) = ''
  let left: null | (() => boolean) = null
  let operation: false | undefined | string
  let lastChar = ''
  let char = ''
  for (let p = 0; p < length; p++) {
    lastChar = char
    char = expression.charAt(p)
    if (!quote && (char === "'" || char === '"') && lastChar !== '\\') {
      quote = char
      continue
    } else if (quote && (char !== quote || lastChar === '\\')) {
      operand += char
    } else if (quote === char) {
      quote = false
      operand = `"${operand}"`
    } else if (char === ' ') {
      continue
    } else if (char === '(') {
      depth++
    } else if (char === ')') {
      depth--
      if (depth === 0) {
        // we just dropped back down to the base level
        operand = parseLogicals(operand as string)
      }
    } else if (
      depth === 0 &&
      (operation = getOp(symbols, char, p, expression))
    ) {
      if (p === 0)
        throw new Error(
          `Schema conditional expression cannot start with operator (${operation})`
        )

      // We identified the operator by looking ahead in the string, so we need
      // our position to move past the operator
      p += operation.length - 1
      if (p === expression.length - 1) {
        throw new Error(
          `Schema conditional expression cannot end with operator (${operation})`
        )
      }
      if (!op) {
        // Bind the left hand operand
        if (left) {
          // In this case we've already parsed the left hand operator
          op = operators[operation].bind(null, evaluate(left))
          left = null
        } else {
          op = operators[operation].bind(null, evaluate(operand))
          operand = ''
        }
      } else {
        // Bind the right hand operand, and return the resulting expression as a new left hand operator
        left = op.bind(null, evaluate(operand)) as () => boolean
        op = operators[operation].bind(null, left)
        operand = ''
      }
      continue
    } else {
      if (typeof operand === 'function') {
        throw new Error('Schema conditional syntax error')
      }
      operand += char
    }
  }
  if (operand && op) {
    // If we were left with an operand after the loop, and an op, it should
    // be the right hand assignment.
    op = op.bind(null, evaluate(operand))
  }

  // If we don't have an op, but we do have a left hand assignment, then that
  // is actually our operator, so just re-assign it to op
  op = !op && left ? left : op

  if (!op && operand) {
    // If we don't have any op but we do have an operand so there is no boolean
    // logic to perform, but that operand still means something so we need to
    // evaluate it and return it as a function
    op = (v: any): boolean => (typeof v === 'function' ? v() : v)
    op = op.bind(null, evaluate(operand))
  }

  if (!op && !operand) {
    throw new Error('Schema conditional syntax error')
  }
  return op as () => boolean
}

/**
 * Given a string like '$name==bobby' evaluate it to true or false
 * @param operand - A left or right boolean operand — usually conditions
 * @returns
 */
function evaluate(
  operand: string | (() => boolean)
): boolean | string | number | (() => boolean) {
  if (typeof operand === 'string') {
    if (operand === 'true') return true
    if (operand === 'false') return false
    if (operand.startsWith('"') && operand.endsWith('"'))
      return operand.substr(1, operand.length - 2)
    if (!isNaN(+operand)) return Number(operand)
    if (operand) return operand
    // throw Error(`Unknown statement (${typeof operand}) ${operand}`)
  }
  return operand as () => boolean
}

/**
 * Extract a given condition to a tuple of required values and a function to
 * run with those values.
 * @param condition - The condition in string format, ex: "$a.value == $b.value"
 */
// export function extractCondition(condition: string) {

// }
