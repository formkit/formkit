import { isQuotedString, rmEscapes, parseArgs, getAt } from '@formkit/utils'
import { warn, error } from './errors'

/**
 * Tokens are strings that map to functions.
 *
 * @internal
 */
interface FormKitTokens {
  [index: string]: (...args: any[]) => any
}
/**
 * The compiler output, a function that adds the required tokens.
 *
 * @public
 */
export interface FormKitCompilerOutput {
  (tokens?: Record<string, any>): boolean | number | string
  provide: FormKitCompilerProvider
}

/**
 * A function that accepts a callback with a token as the only argument, and
 * must return a function that provides the true value of the token.
 *
 * @public
 */
export type FormKitCompilerProvider = (
  callback: (requirements: string[]) => Record<string, () => any>
) => FormKitCompilerOutput

/**
 * Logical operations are always a left/right fn
 *
 * @internal
 */
type LogicOperator = (
  l: any,
  r: any,
  t?: Record<string, any>,
  tt?: any
) => boolean | number | string

/**
 * A set of logical operators used for parsing string logic.
 *
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
 *
 * @internal
 */
type OperatorRegistry = LogicOperators[]

/**
 * Compiles a logical string like `"a != z || b == c"` into a single function.
 * The return value is an object with a "provide" method that iterates over all
 * requirement tokens to use as replacements.
 *
 * @example
 *
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
 *
 * @param expr - A string to compile.
 *
 * @returns A {@link FormKitCompilerOutput | FormKitCompilerOutput}.
 *
 * @public
 */
export function compile(expr: string): FormKitCompilerOutput {
  /**
   * These tokens are replacements used in evaluating a given condition.
   */
  // const tokens: FormKitTokens = {}

  /**
   * The value of the provide() callback. Used for late binding.
   */
  let provideTokens: (requirements: string[]) => Record<string, () => any>

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
  const x = function expand(operand: any, tokens?: Record<string, any>): any {
    return typeof operand === 'function' ? operand(tokens) : operand
  }

  /**
   * Comprehensive list of operators. This list MUST be
   * ordered by the length of the operator characters in descending order.
   */
  const operatorRegistry: OperatorRegistry = [
    {
      '&&': (l, r, t) => x(l, t) && x(r, t),
      '||': (l, r, t) => x(l, t) || x(r, t),
    },
    {
      '===': (l, r, t) => !!(x(l, t) === x(r, t)),
      '!==': (l, r, t) => !!(x(l, t) !== x(r, t)),
      '==': (l, r, t) => !!(x(l, t) == x(r, t)),
      '!=': (l, r, t) => !!(x(l, t) != x(r, t)),
      '>=': (l, r, t) => !!(x(l, t) >= x(r, t)),
      '<=': (l, r, t) => !!(x(l, t) <= x(r, t)),
      '>': (l, r, t) => !!(x(l, t) > x(r, t)),
      '<': (l, r, t) => !!(x(l, t) < x(r, t)),
    },
    {
      '+': (l, r, t) => x(l, t) + x(r, t),
      '-': (l, r, t) => x(l, t) - x(r, t),
    },
    {
      '*': (l, r, t) => x(l, t) * x(r, t),
      '/': (l, r, t) => x(l, t) / x(r, t),
      '%': (l, r, t) => x(l, t) % x(r, t),
    },
  ]

  /**
   * A full list of all operator symbols.
   */
  const operatorSymbols = operatorRegistry.reduce((s, g) => {
    return s.concat(Object.keys(g))
  }, [] as string[])

  /**
   * An array of the first character of each operator.
   */
  const operatorChars = new Set(operatorSymbols.map((key) => key.charAt(0)))

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
        const nextChars = expression.substring(p, p + symbol.length)
        if (nextChars === symbol) return symbol
      }
      return false
    })
  }

  /**
   * Determines the step number of the right or left hand operator.
   * @param p - The position of the pointer
   * @param expression - The full string expression
   * @param direction - 1 = right, 0 = left
   */
  function getStep(p: number, expression: string, direction = 1): number {
    let next = direction
      ? expression.substring(p + 1).trim()
      : expression.substring(0, p).trim()
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
   * Extracts a tail call. For example:
   * ```
   * $foo().bar(baz) + 7
   * ```
   * Would extract "bar(baz)" and return p of 15 (after the (baz)).
   *
   * @param p - The position of a closing parenthetical.
   * @param expression - The full expression being parsed.
   */
  function getTail(pos: number, expression: string): [tail: string, p: number] {
    let tail = ''
    const length = expression.length
    let depth = 0
    for (let p = pos; p < length; p++) {
      const char = expression.charAt(p)
      if (char === '(') {
        depth++
      } else if (char === ')') {
        depth--
      } else if (depth === 0 && char === ' ') {
        continue
      }
      if (depth === 0 && getOp(operatorSymbols, char, p, expression)) {
        return [tail, p - 1]
      } else {
        tail += char
      }
    }
    return [tail, expression.length - 1]
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
    let parenQuote: false | string = ''
    let startP = 0
    const addTo = (depth: number, char: string) => {
      depth ? (parenthetical += char) : (operand += char)
    }
    for (let p = 0; p < length; p++) {
      lastChar = char
      char = expression.charAt(p)
      if (
        (char === "'" || char === '"') &&
        lastChar !== '\\' &&
        ((depth === 0 && !quote) || (depth && !parenQuote))
      ) {
        if (depth) {
          parenQuote = char
        } else {
          quote = char
        }
        addTo(depth, char)
        continue
      } else if (
        (quote && (char !== quote || lastChar === '\\')) ||
        (parenQuote && (char !== parenQuote || lastChar === '\\'))
      ) {
        addTo(depth, char)
        continue
      } else if (quote === char) {
        quote = false
        addTo(depth, char)
        continue
      } else if (parenQuote === char) {
        parenQuote = false
        addTo(depth, char)
        continue
      } else if (char === ' ') {
        continue
      } else if (char === '(') {
        if (depth === 0) {
          startP = p
        } else {
          parenthetical += char
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
          const fn =
            typeof operand === 'string' && operand.startsWith('$')
              ? operand
              : undefined
          const hasTail = fn && expression.charAt(p + 1) === '.'
          // It's possible the function has a chained tail call:
          let tail = ''
          if (hasTail) {
            ;[tail, p] = getTail(p + 2, expression)
          }
          const lStep = op ? step : getStep(startP, expression, 0)
          const rStep = getStep(p, expression)
          if (lStep === -1 && rStep === -1) {
            // This parenthetical was unnecessarily wrapped at the root, or
            // these are args of a function call.
            operand = evaluate(parenthetical, -1, fn, tail) as string
          } else if (op && (lStep >= rStep || rStep === -1) && step === lStep) {
            // has a left hand operator with a higher order of operation
            left = op.bind(null, evaluate(parenthetical, -1, fn, tail))
            op = null
            operand = ''
          } else if (rStep > lStep && step === rStep) {
            // should be applied to the right hand operator when it gets one
            operand = evaluate(parenthetical, -1, fn, tail) as string
          } else {
            operand += `(${parenthetical})${hasTail ? `.${tail}` : ''}`
          }
          parenthetical = ''
        } else {
          parenthetical += char
        }
      } else if (
        depth === 0 &&
        (operation = getOp(symbols, char, p, expression))
      ) {
        if (p === 0) {
          error(103, [operation, expression])
        }

        // We identified the operator by looking ahead in the string, so we need
        // our position to move past the operator
        p += operation.length - 1
        if (p === expression.length - 1) {
          error(104, [operation, expression])
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
        } else if (operand) {
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
      op = (v: any, t: Record<string, any>): boolean => {
        return typeof v === 'function' ? v(t) : v
      }
      op = op.bind(null, evaluate(operand, step))
    }

    if (!op && !operand) {
      error(105, expression)
    }
    return op as () => boolean | number | string
  }

  /**
   * Given a string like '$name==bobby' evaluate it to true or false
   * @param operand - A left or right boolean operand — usually conditions
   * @param step - The current order of operation
   * @param fnToken - The token (string) representation of a function being called
   * @returns
   */
  function evaluate(
    operand:
      | string
      | number
      | boolean
      | ((...args: any[]) => boolean | number | string),
    step: number,
    fnToken?: string,
    tail?: string //eslint-disable-line
  ):
    | boolean
    | undefined
    | string
    | number
    | ((...args: any[]) => boolean | number | string | CallableFunction) {
    if (fnToken) {
      const fn = evaluate(fnToken, operatorRegistry.length)
      let userFuncReturn: unknown
      // "Tail calls" are dot accessors after a function $foo().value. We need
      // to compile tail calls, and then provide the function result to the
      // exposed tokens.
      let tailCall: false | FormKitCompilerOutput = tail
        ? compile(`$${tail}`)
        : false
      if (typeof fn === 'function') {
        const args = parseArgs(String(operand)).map((arg: string) =>
          evaluate(arg, -1)
        )
        return (tokens: Record<string, any>) => {
          const userFunc = fn(tokens)
          if (typeof userFunc !== 'function') {
            warn(150, fnToken)
            return userFunc
          }
          userFuncReturn = userFunc(
            ...args.map((arg) =>
              typeof arg === 'function' ? arg(tokens) : arg
            )
          )
          if (tailCall) {
            tailCall = tailCall.provide((subTokens) => {
              const rootTokens = provideTokens(subTokens)
              const t = subTokens.reduce(
                (tokenSet: Record<string, any>, token: string) => {
                  const isTail = token === tail || tail?.startsWith(`${token}(`)
                  if (isTail) {
                    const value = getAt(userFuncReturn, token)
                    tokenSet[token] = () => value
                  } else {
                    tokenSet[token] = rootTokens[token]
                  }
                  return tokenSet
                },
                {} as Record<string, any>
              )
              return t
            })
          }
          return tailCall ? tailCall() : (userFuncReturn as string)
        }
      }
    } else if (typeof operand === 'string') {
      // the word true or false will never contain further operations
      if (operand === 'true') return true
      if (operand === 'false') return false
      if (operand === 'undefined') return undefined

      // Truly quotes strings cannot contain an operation, return the string
      if (isQuotedString(operand))
        return rmEscapes(operand.substring(1, operand.length - 1))

      // Actual numbers cannot be contain an operation
      if (!isNaN(+operand)) return Number(operand)

      if (step < operatorRegistry.length - 1) {
        return parseLogicals(operand, step + 1)
      } else {
        if (operand.startsWith('$')) {
          const cleaned = operand.substring(1)
          requirements.add(cleaned)
          return function getToken(tokens: FormKitTokens) {
            return cleaned in tokens ? tokens[cleaned]() : undefined
          }
        }
        // In this case we are dealing with an unquoted string, just treat it
        // as a plain string.
        return operand
      }
    }
    return operand
  }

  /**
   * Compile the string.
   */
  const compiled = parseLogicals(
    expr.startsWith('$:') ? expr.substring(2) : expr
  )

  /**
   * Convert compiled requirements to an array.
   */
  const reqs = Array.from(requirements)

  /**
   * Provides token values via callback to compiled output.
   * @param callback - A callback that needs to provide all token requirements
   * @returns
   */
  function provide(
    callback: (requirements: string[]) => Record<string, () => any>
  ): FormKitCompilerOutput {
    provideTokens = callback
    return Object.assign(
      // @ts-ignore - @rollup/plugin-typescript for some reason will not allow
      // this binding. I’ve been unable to reproduce it.
      compiled.bind(null, callback(reqs)),
      { provide }
    )
  }
  return Object.assign(compiled, {
    provide,
  })
}
