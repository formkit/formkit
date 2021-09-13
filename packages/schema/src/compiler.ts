import { has, isQuotedString } from '@formkit/utils'

/**
 * Tokens are strings that map to functions.
 * @internal
 */
interface FormKitTokens {
  [index: string]: () => any
}
/**
 * The compiler output, a function that adds the required tokens.
 * @internal
 */
interface FormKitConditionCompiler {
  (): boolean | number | string
  provide: (
    callback: (token: string) => () => any
  ) => () => boolean | number | string
}

/**
 * Logical operations are always a left/right fn
 * @internal
 */
type LogicOperator = (l: any, r: any) => boolean | number | string

/**
 * A set of logical operators used for parsing string logic.
 * @internal
 */
interface LogicOperators {
  [index: string]: LogicOperator
}

/**
 * Describes a registry of operators that occur at different periods during
 * the order of operations. Typically this is:
 * 0: Boolean
 * 1: Comparison
 * 2: Arithmetic
 */
type OperatorRegistry = LogicOperators[]

/**
 * Compiles a logical string like "a != z || b == c" into a single function.
 * The return value is an object with a "provide" method that iterates over all
 * requirement tokens to use as replacements.
 * ```typescript
 * let name = {
 *   value: 'jon'
 * }
 * const condition = compile("$name == 'bob'").provide((token) => {
 *  return () => name.value // must return a function!
 * })
 *
 * condition() // false
 * ```
 * @param expr - A string to compile
 * @returns
 * @public
 */
export function compile(expr: string): FormKitConditionCompiler {
  /**
   * These tokens are replacements used in evaluating a given condition.
   */
  const tokens: FormKitTokens = {}
  /**
   * These are token requirements like "$name.value" that are need to fulfill
   * a given condition call.
   */
  const requirements = new Set<string>()

  /**
   * Expands the current value if it is a function.
   * @param operand - A left or right hand operand
   * @returns
   */
  const x = function expand(operand: any): any {
    return typeof operand === 'function' ? operand() : operand
  }

  /**
   * Comprehensive list of operators. This list MUST be
   * ordered by the length of the operator characters in descending order.
   */
  const operatorRegistry: OperatorRegistry = [
    {
      '&&': (l, r) => !!(x(l) && x(r)),
      '||': (l, r) => !!(x(l) || x(r)),
    },
    {
      '===': (l, r) => !!(x(l) === x(r)),
      '!==': (l, r) => !!(x(l) !== x(r)),
      '==': (l, r) => !!(x(l) == x(r)),
      '!=': (l, r) => !!(x(l) != x(r)),
      '>=': (l, r) => !!(x(l) >= x(r)),
      '<=': (l, r) => !!(x(l) <= x(r)),
      '>': (l, r) => !!(x(l) > x(r)),
      '<': (l, r) => !!(x(l) < x(r)),
    },
    {
      '+': (l, r) => x(l) + x(r),
      '-': (l, r) => x(l) - x(r),
    },
    {
      '*': (l, r) => x(l) * x(r),
      '/': (l, r) => x(l) / x(r),
    },
  ]

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
  function parseLogicals(
    expression: string,
    step = 0
  ): () => boolean | number | string {
    const operators = operatorRegistry[step]
    const length = expression.length
    const symbols = Object.keys(operators)
    let depth = 0
    let quote: false | string = false
    let op: null | ((l: any, r: any) => boolean | number | string) = null
    let operand: string | (() => boolean | number | string) = ''
    let left: null | (() => boolean | number | string) = null
    let operation: false | undefined | string
    let lastChar = ''
    let char = ''
    let parentheticalOperand = ''
    for (let p = 0; p < length; p++) {
      lastChar = char
      char = expression.charAt(p)
      if (!quote && (char === "'" || char === '"') && lastChar !== '\\') {
        quote = char
        operand += char
        continue
      } else if (quote && (char !== quote || lastChar === '\\')) {
        operand += char
        continue
      } else if (quote === char) {
        quote = false
        operand += char
        continue
      } else if (char === ' ') {
        continue
      } else if (char === '(') {
        depth++
      } else if (char === ')') {
        depth--
        if (depth === 0) {
          // we just dropped back down to the base level so we assume this
          // operand is ready to use, but in case it comes "early" we store the
          // string value so it can replayed in a later parse step. Example:
          // (33 - 3) * 2 - 5 === 55
          // in this case (33 - 3) would be considered the left hand operand of
          // the boolean operator step initially, but when it hits "*2-5" the
          // parser would "choke" because the left hand operand is a function
          // so we need to store the original string value and fall back to
          // just using the string.
          parentheticalOperand = operand as string
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
            op = operators[operation].bind(null, evaluate(left, step))
            left = null
          } else {
            op = operators[operation].bind(null, evaluate(operand, step))
            operand = ''
          }
        } else {
          // Bind the right hand operand, and return the resulting expression as a new left hand operator
          left = op.bind(null, evaluate(operand, step)) as () =>
            | boolean
            | number
            | string
          op = operators[operation].bind(null, left)
          operand = ''
        }
        continue
      } else {
        if (typeof operand === 'function') {
          // See comment about the parenthetical operand above.
          operand = `(${parentheticalOperand})${char}`
        } else {
          operand += char
        }
      }
    }
    if (operand && op) {
      // If we were left with an operand after the loop, and an op, it should
      // be the right hand assignment.
      op = op.bind(null, evaluate(operand, step))
    }

    // If we don't have an op, but we do have a left hand assignment, then that
    // is actually our operator, so just re-assign it to op
    op = !op && left ? left : op

    if (!op && operand) {
      // If we don't have any op but we do have an operand so there is no boolean
      // logic to perform, but that operand still means something so we need to
      // evaluate it and return it as a function
      op = (v: any): boolean => (typeof v === 'function' ? v() : v)
      op = op.bind(null, evaluate(operand, step))
    }

    if (!op && !operand) {
      throw new Error('Schema conditional syntax error')
    }
    return op as () => boolean | number | string
  }

  /**
   * Given a string like '$name==bobby' evaluate it to true or false
   * @param operand - A left or right boolean operand — usually conditions
   * @returns
   */
  function evaluate(
    operand: string | (() => boolean | number | string),
    step: number
  ): boolean | string | number | (() => boolean | number | string) {
    if (typeof operand === 'string') {
      // the word true or false will never contain further operations
      if (operand === 'true') return true
      if (operand === 'false') return false

      // Truly quotes strings cannot contain an operation, return the string
      if (isQuotedString(operand)) return operand.substr(1, operand.length - 2)

      // Actual numbers cannot be contain an operation
      if (!isNaN(+operand)) return Number(operand)

      if (step < operatorRegistry.length - 1) {
        return parseLogicals(operand, step + 1)
      } else {
        if (operand.startsWith('$')) {
          const cleaned = operand.substr(1)
          requirements.add(cleaned)
          return () => (has(tokens, cleaned) ? tokens[cleaned]() : undefined)
        }
        // In this case we are dealing with an unquoted string, just treat it
        // as a plain string.
        return operand
      }
    }
    return operand as () => boolean | number | string
  }

  const compiledCondition = parseLogicals(
    expr.startsWith('$:') ? expr.substr(2) : expr
  )
  return Object.assign(compiledCondition, {
    provide: (callback: (token: string) => () => any) => {
      requirements.forEach((requirement) => {
        tokens[requirement] = callback(requirement)
      })
      return compiledCondition
    },
  })
}
