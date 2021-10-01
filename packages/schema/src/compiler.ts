import { has, isQuotedString, rmEscapes, parseArgs } from '@formkit/utils'
import { warn } from '@formkit/core'

/**
 * Tokens are strings that map to functions.
 * @internal
 */
interface FormKitTokens {
  [index: string]: (...args: any[]) => any
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
      '%': (l, r) => x(l) % x(r),
    },
  ]

  /**
   * An array of the first character of each operator.
   */
  const operatorChars = operatorRegistry.reduce((o, r) => {
    Object.keys(r).map((k) => o.add(k[0]))
    return o
  }, new Set())

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
   * Determines the step number of the right hand operator.
   * @param p - The position of the pointer
   * @param expression - The full string expression
   */
  function getStep(p: number, expression: string, direction = 1): number {
    let next = direction
      ? expression.substr(p + 1).trim()
      : expression.substr(0, p).trim()
    if (!next.length) return -1
    if (!direction) {
      // left hand direction could include a function name we need to remove
      const reversed = next.split('').reverse()
      const start = reversed.findIndex((char) => operatorChars.has(char))
      next = reversed.slice(start).join('')
    }
    const char = next[0]
    return operatorRegistry.findIndex((operators) => {
      const symbols = Object.keys(operators)
      return !!getOp(symbols, char, 0, next)
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
    let operand: string | number | boolean | (() => boolean | number | string) =
      ''
    let left: null | ((r?: any) => boolean | number | string) = null
    let operation: false | undefined | string
    let lastChar = ''
    let char = ''
    let parenthetical = ''
    let startP = 0
    const addTo = (depth: number, char: string) => {
      depth ? (parenthetical += char) : (operand += char)
    }
    for (let p = 0; p < length; p++) {
      lastChar = char
      char = expression.charAt(p)
      if (
        !quote &&
        (char === "'" || char === '"') &&
        lastChar !== '\\' &&
        depth === 0
      ) {
        quote = char
        addTo(depth, char)
        continue
      } else if (quote && (char !== quote || lastChar === '\\')) {
        addTo(depth, char)
        continue
      } else if (quote === char) {
        quote = false
        addTo(depth, char)
        continue
      } else if (char === ' ') {
        continue
      } else if (char === '(') {
        if (depth === 0) {
          startP = p
        }
        depth++
      } else if (char === ')') {
        depth--
        if (depth === 0) {
          // Parenthetical statements cannot be grouped up in the implicit order
          // of left/right statements based on which step they are on because
          // they are parsed on every step and then must be applied to the
          // operator. Example:
          //
          // 5 + (3) * 2
          //
          // This should yield 11 not 16. This order is normally implicit in the
          // sequence of operators being parsed, but with parenthesis the parse
          // happens each time. Instead we need to know if the resulting value
          // should be applied to the left or the right hand operator. The
          // general algorithm is:
          //
          // 1. Does this paren have an operator on the left or right side
          // 2. If not, it's unnecessarily wrapped (3 + 2)
          // 3. If it does, then which order of operation is highest?
          // 4. Wait for the highest order of operation to bind to an operator.

          // If the parenthetical has a preceding token like $fn(1 + 2) then we
          // need to subtract the existing operand length from the start
          // to determine if this is a left or right operation
          const lStep = op ? step : getStep(startP, expression, 0)
          const rStep = getStep(p, expression)
          const fn =
            typeof operand === 'string' && operand.startsWith('$')
              ? operand
              : undefined
          if (lStep === -1 && rStep === -1) {
            // This parenthetical was unnecessarily wrapped
            operand = evaluate(parenthetical, -1, fn) as string
          } else if (op && (lStep >= rStep || rStep === -1) && step === lStep) {
            // has a left hand operator with a lower order of operation
            op = op.bind(null, evaluate(parenthetical, -1, fn))
          } else if (rStep > lStep && step === rStep) {
            // should be applied to the right hand operator when it gets
            operand = evaluate(parenthetical, -1, fn) as string
          } else {
            operand += `(${parenthetical})`
          }
          parenthetical = ''
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
        addTo(depth, char)
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
    operand:
      | string
      | number
      | boolean
      | ((...args: any[]) => boolean | number | string),
    step: number,
    fnToken?: string
  ):
    | boolean
    | string
    | number
    | ((...args: any[]) => boolean | number | string | CallableFunction) {
    if (fnToken) {
      const fn = evaluate(fnToken, operatorRegistry.length)
      if (typeof fn === 'function') {
        const args = parseArgs(String(operand)).map((arg: string) =>
          evaluate(arg, -1)
        )
        return () => {
          const userFunc = fn()
          if (typeof userFunc !== 'function') {
            warn(234)
            return userFunc
          }
          return userFunc(
            ...args.map((arg) => (typeof arg === 'function' ? arg() : arg))
          )
        }
      }
    } else if (typeof operand === 'string') {
      // the word true or false will never contain further operations
      if (operand === 'true') return true
      if (operand === 'false') return false

      // Truly quotes strings cannot contain an operation, return the string
      if (isQuotedString(operand))
        return rmEscapes(operand.substr(1, operand.length - 2))

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
    return operand
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
