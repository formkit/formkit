import { createElement, useState } from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FormKitIcon, FormKitProvider, defaultConfig } from '../src'

const chevronIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 7"><path d="M8,6.5c-.13,0-.26-.05-.35-.15L3.15,1.85c-.2-.2-.2-.51,0-.71,.2-.2,.51-.2,.71,0l4.15,4.15L12.15,1.15c.2-.2,.51-.2,.71,0,.2,.2,.2,.51,0,.71l-4.5,4.5c-.1,.1-.23,.15-.35,.15Z" fill="currentColor"/></svg>'

const circleIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle fill="currentColor" cx="16" cy="16" r="16"/></svg>'

describe('FormKitIcon component (react)', () => {
  it('can render an inline svg', async () => {
    const { container } = render(
      createElement(
        FormKitProvider,
        { config: defaultConfig() },
        createElement(FormKitIcon, {
          icon: chevronIcon,
          iconLoader: (iconName) => iconName,
        })
      )
    )

    await waitFor(() => {
      expect(container.querySelector('.formkit-icon svg')).toBeTruthy()
    })
  })

  it('can render an icon from the FormKit icon registry', async () => {
    const { container } = render(
      createElement(
        FormKitProvider,
        {
          config: defaultConfig({
            icons: {
              libraryIcon: chevronIcon,
            },
          }),
        },
        createElement(FormKitIcon, {
          icon: 'libraryIcon',
        })
      )
    )

    await waitFor(() => {
      expect(container.querySelector('.formkit-icon svg')).toBeTruthy()
    })
  })

  it('re-renders its icon when the icon prop changes', async () => {
    function Host() {
      const [icon, setIcon] = useState('libraryIcon')
      return createElement(
        FormKitProvider,
        {
          config: defaultConfig({
            icons: {
              libraryIcon: chevronIcon,
              circleIcon,
            },
          }),
        },
        createElement(
          'div',
          null,
          createElement(FormKitIcon, { icon }),
          createElement('button', { onClick: () => setIcon('circleIcon') }, 'swap')
        )
      )
    }

    const { container } = render(createElement(Host))

    await waitFor(() => {
      expect(container.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 16 7')
    })

    fireEvent.click(container.querySelector('button') as HTMLButtonElement)

    await waitFor(() => {
      expect(container.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 32 32')
    })
  })
})
