import {
  ReactNode,
  createElement,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { rootSymbol } from './context'

/**
 * The FormKitRoot wrapper component used to provide context to FormKit about
 * whether a FormKit input is booting in a Document or ShadowRoot.
 */
export function FormKitRoot(props: { children?: ReactNode }) {
  const boundary = useRef<HTMLSpanElement | null>(null)
  const [root, setRoot] = useState<Document | ShadowRoot | undefined>(undefined)

  useLayoutEffect(() => {
    const boundaryNode = boundary.current
    if (!boundaryNode) return
    const nextRoot = boundaryNode.getRootNode()
    const isShadowRoot =
      typeof ShadowRoot !== 'undefined' && nextRoot instanceof ShadowRoot
    if (isShadowRoot || nextRoot instanceof Document) {
      setRoot(nextRoot)
    }
  }, [])

  if (!root) {
    return createElement('span', {
      ref: boundary,
      style: { display: 'none' },
    })
  }

  return createElement(rootSymbol.Provider, { value: root }, props.children)
}

export { rootSymbol }
