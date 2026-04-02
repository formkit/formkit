import { createContext } from 'react'
import type { FormKitNode } from '@formkit/core'

const isBrowser = typeof window !== 'undefined'

/**
 * Parent FormKit node context.
 */
export const parentSymbol = createContext<FormKitNode | null>(null)

/**
 * Component ownership callback context (used by tooling/HMR integrations).
 */
export const componentSymbol = createContext<(node: FormKitNode) => void>(
  () => {
    /* noop */
  }
)

/**
 * Document/ShadowRoot boundary context.
 */
export const rootSymbol = createContext<Document | ShadowRoot | undefined>(
  isBrowser ? document : undefined
)
