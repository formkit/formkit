import { createElement, useContext, useMemo } from 'react'
import { describe, expect, it } from 'vitest'
import { fireEvent, waitFor } from '@testing-library/react'
import { FormKitConfig } from '@formkit/core'
import { configSymbol } from '../src/plugin'
import { FormKit, defaultConfig } from '../src'
import { renderWithFormKit } from './helpers'

function ClassConfigHost() {
  const config = useContext(configSymbol) as FormKitConfig
  const updateConfig = useMemo(
    () => () => {
      config.rootClasses = (section: string) => ({
        [`fizzkit-${section}`]: true,
      })
    },
    [config]
  )

  return createElement(
    'div',
    null,
    createElement(
      'button',
      {
        onClick: updateConfig,
      },
      'update'
    ),
    createElement(FormKit as any, {
      type: 'text',
      label: 'Test input',
    })
  )
}

describe('classes (react)', () => {
  it('updates classes if the underlying config changes', async () => {
    const { container } = renderWithFormKit(
      createElement(ClassConfigHost),
      defaultConfig()
    )

    expect(container.querySelector('label')?.getAttribute('class')).toBe(
      'formkit-label'
    )

    fireEvent.click(container.querySelector('button') as HTMLButtonElement)

    await waitFor(() => {
      expect(container.querySelector('label')?.getAttribute('class')).toBe(
        'fizzkit-label'
      )
    })
  })
})
