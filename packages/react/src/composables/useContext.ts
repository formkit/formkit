import { getNode, watchRegistry, stopWatch } from '@formkit/core'
import type {
  FormKitFrameworkContext,
  FormKitGroupValue,
  FormKitNode,
} from '@formkit/core'
import { useContext, useEffect, useState } from 'react'
import { parentSymbol } from '../context'
import { useReactiveStore } from '../reactiveStore'

export function useFormKitContext<T = FormKitGroupValue>(
  effect?: (context: FormKitFrameworkContext<T>) => void
): FormKitFrameworkContext<T> | undefined

export function useFormKitContext<T = FormKitGroupValue>(
  address?: string,
  effect?: (context: FormKitFrameworkContext<T>) => void
): FormKitFrameworkContext<T> | undefined

export function useFormKitContext<T = FormKitGroupValue>(
  addressOrEffect?: string | ((context: FormKitFrameworkContext<T>) => void),
  optionalEffect?: (context: FormKitFrameworkContext<T>) => void
): FormKitFrameworkContext<T> | undefined {
  const address =
    typeof addressOrEffect === 'string' ? addressOrEffect : undefined
  const effect =
    typeof addressOrEffect === 'function' ? addressOrEffect : optionalEffect

  const parentNode = useContext(parentSymbol)
  const [effectRef] = useState(() => ({
    current:
      (effect as ((context: FormKitFrameworkContext<T>) => void) | undefined) ??
      undefined,
  }))
  effectRef.current = effect
  const [context, setContext] = useState<FormKitFrameworkContext<T> | undefined>(
    () => {
      if (!parentNode) return undefined
      if (address) {
        return parentNode.at(address)?.context as FormKitFrameworkContext<T>
      }
      return parentNode.context as FormKitFrameworkContext<T>
    }
  )

  useEffect(() => {
    if (!parentNode) {
      if (__DEV__) {
        console.warn(
          'useFormKitContext must be used as a child of a FormKit component.'
        )
      }
      return
    }

    if (!address) {
      const next = parentNode.context as FormKitFrameworkContext<T>
      setContext(next)
      if (next && effectRef.current) effectRef.current(next)
      return
    }

    const nextContext = parentNode.at(address)?.context as
      | FormKitFrameworkContext<T>
      | undefined
    setContext(nextContext)
    if (nextContext && effectRef.current) effectRef.current(nextContext)

    const root = parentNode.at('$root')
    if (!root) return

    const receipt = root.on('child.deep', () => {
      const targetNode = parentNode.at(address)
      if (!targetNode) return
      const latestContext = targetNode.context as FormKitFrameworkContext<T>
      setContext((previous) => {
          if (previous !== latestContext) {
          if (effectRef.current) effectRef.current(latestContext)
          return latestContext
        }
        return previous
      })
    })

    return () => {
      root.off(receipt)
    }
  }, [address, parentNode])

  useReactiveStore(context)

  return context
}

export function useFormKitContextById<T = any>(
  id: string,
  effect?: (context: FormKitFrameworkContext<T>) => void
): FormKitFrameworkContext<T> | undefined {
  const [effectRef] = useState(() => ({
    current:
      (effect as ((context: FormKitFrameworkContext<T>) => void) | undefined) ??
      undefined,
  }))
  effectRef.current = effect
  const [context, setContext] = useState<FormKitFrameworkContext<T> | undefined>(
    () => getNode<T>(id)?.context as FormKitFrameworkContext<T> | undefined
  )

  useEffect(() => {
    const targetNode = getNode<T>(id)
    if (targetNode) {
      const next = targetNode.context as FormKitFrameworkContext<T>
      setContext(next)
      if (effectRef.current) effectRef.current(next)
      return
    }

    const receipt = watchRegistry(id, ({ payload: node }) => {
      if (node) {
        const next = node.context as FormKitFrameworkContext<T>
        stopWatch(receipt)
        queueMicrotask(() => {
          setContext(next)
          if (effectRef.current) effectRef.current(next)
        })
      }
    })

    return () => {
      stopWatch(receipt)
    }
  }, [id])

  useReactiveStore(context)

  return context
}

export function useFormKitNodeById<T>(
  id: string,
  effect?: (node: FormKitNode<T>) => void
): FormKitNode<T> | undefined {
  const [effectRef] = useState(() => ({
    current: (effect as ((node: FormKitNode<T>) => void) | undefined) ?? undefined,
  }))
  effectRef.current = effect
  const [nodeRef, setNodeRef] = useState<FormKitNode<T> | undefined>(() =>
    getNode<T>(id)
  )

  useEffect(() => {
    const targetNode = getNode<T>(id)
    if (targetNode) {
      setNodeRef(targetNode)
      if (effectRef.current) effectRef.current(targetNode)
      return
    }

    const receipt = watchRegistry(id, ({ payload: node }) => {
      if (node) {
        const typedNode = node as FormKitNode<T>
        stopWatch(receipt)
        queueMicrotask(() => {
          setNodeRef(typedNode)
          if (effectRef.current) effectRef.current(typedNode)
        })
      }
    })

    return () => {
      stopWatch(receipt)
    }
  }, [id])

  return nodeRef
}
