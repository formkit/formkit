import { createElement, ReactElement, StrictMode } from 'react'
import { cleanup, render } from '@testing-library/react'
import { afterEach } from 'vitest'
import {
  defaultConfig,
  FormKitProvider,
  DefaultConfigOptions,
  FormKitOptions,
} from '../src'

afterEach(() => {
  cleanup()
})

export function renderWithFormKit(
  node: ReactElement,
  config: FormKitOptions | DefaultConfigOptions = defaultConfig()
) {
  // Render under StrictMode by default: it is what Next.js, Vite and CRA apps
  // run in development, and it double-invokes renders/memos/effects, which
  // previously duplicated nodes and broke form submission (#1776).
  return render(
    createElement(StrictMode, null, createElement(FormKitProvider, { config }, node))
  )
}
