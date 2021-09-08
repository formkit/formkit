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
 * A tuple where the first value describes the required arguments of the second
 * value — a function that returns a conditional function.
 */
export type FormKitExtractedCondition = [
  tokens: string[],
  createCondition: () => () => boolean
]

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
 * Comprehensive list of comparison operators.
//  */
// const comparisons: { [index: string]: (l: any, r: any) => boolean } = {
//   '==': (l: any, r: any) => l == r,
//   '!=': (l: any, r: any) => l != r,
//   '>': (l: any, r: any) => l > r,
//   '>=': (l: any, r: any) => l >= r,
//   '<': (l: any, r: any) => l < r,
//   '<=': (l: any, r: any) => l <= r,
// }

const booleanOps = {
  '&': (l: any, r: any) => {
    const left = typeof l === 'function' ? l() : l
    const right = typeof r === 'function' ? r() : r
    return left && right
  },
  '|': (l: any, r: any) => {
    const left = typeof l === 'function' ? l() : l
    const right = typeof r === 'function' ? r() : r
    return left || right
  },
}

export function parseBools(expression: string): () => boolean {
  let depth = 0
  const length = expression.length
  let op: null | ((l: any, r: any) => boolean) = null
  let operand: string | (() => boolean) = ''
  let left: null | (() => boolean) = null
  for (let p = 0; p < length; p++) {
    const char = expression.charAt(p)
    if (char === ' ') {
      continue
    } else if (char === '(') {
      depth++
    } else if (char === ')') {
      depth--
      if (depth === 0) {
        // we just dropped back down to the base level
        operand = parseBools(operand as string)
      }
    } else if (
      depth === 0 &&
      (char === '&' || char === '|') &&
      p < length + 1 &&
      expression.charAt(p + 1) === char
    ) {
      p++ // skip the next logical operator
      if (!op) {
        // Bind the left hand operand
        if (left) {
          // In this case we've already parsed the left hand operator
          op = booleanOps[char].bind(null, evaluate(left))
          left = null
        } else {
          op = booleanOps[char].bind(null, evaluate(operand))
          operand = ''
        }
      } else {
        // Bind the right hand operand, and return the resulting expression as a new left hand operator
        left = op.bind(null, evaluate(operand)) as () => boolean
        op = booleanOps[char].bind(null, left)
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
    op = op.bind(null, evaluate(operand))
  }
  op = !op && left ? left : op
  if (!op) {
    throw new Error('Schema conditional syntax error')
  }
  return op as () => boolean
}

function evaluate(
  condition: string | (() => boolean)
): boolean | (() => boolean) {
  if (typeof condition === 'string') {
    if (condition === 'true') return true
    if (condition === 'false') return false
    throw Error(`Unknown statement (${typeof condition}) ${condition}`)
  }
  return condition as () => boolean
}

/**
 * Extract a given condition to a tuple of required values and a function to
 * run with those values.
 * @param condition - The condition in string format, ex: "$a.value == $b.value"
 */
// export function extractCondition(condition: string) {

// }
