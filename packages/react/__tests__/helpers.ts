import { createElement, ReactElement } from 'react'
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
  return render(createElement(FormKitProvider, { config }, node))
}
