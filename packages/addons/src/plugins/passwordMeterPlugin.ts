import { FormKitNode, FormKitPlugin } from '@formkit/core'

interface FormKitSections {
  suffix?: HTMLElement
  [key: string]: HTMLElement | undefined
}

interface FormKitContext {
  sections?: FormKitSections
}

interface PasswordMeterOptions {
  strongRegex?: string
  mediumRegex?: string
  weakLabel?: string
  mediumLabel?: string
  strongLabel?: string
  position?: 'popup' | 'below'
}

const defaultOptions: PasswordMeterOptions = {
  strongRegex: '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@#$%^*!~]).{12,}$',
  mediumRegex: '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}$',
  weakLabel: 'Weak',
  mediumLabel: 'Medium',
  strongLabel: 'Strong',
  position: 'popup'
}

/**
 * Creates a password meter plugin for FormKit password inputs
 *
 * @example
 * ```javascript
 * createApp(app).use(plugin, defaultConfig({
 *   plugins: [
 *     createPasswordMeterPlugin({
 *       // optional config
 *       strongRegex: '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@#$%^*!~]).{12,}$',
 *       mediumRegex: '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}$',
 *       weakLabel: 'Weak password',
 *       mediumLabel: 'Good password',
 *       strongLabel: 'Strong password',
 *       position: 'popup'
 *     })
 *   ]
 * }))
 * ```
 */
export function createPasswordMeterPlugin(options?: PasswordMeterOptions): FormKitPlugin {
  const config = { ...defaultOptions, ...options }

  return (node: FormKitNode) => {
    // Only apply to password inputs
    if (node.props.type !== 'password') return

    // Add passwordMeter prop
    node.addProps(['passwordMeter'])

    // Check if passwordMeter prop exists
    if (!node.props.passwordMeter) return

    const meterOptions = typeof node.props.passwordMeter === 'object'
      ? { ...config, ...node.props.passwordMeter }
      : config

    // Add password meter schema
    if (node.props.definition?.schema) {
      const originalSchema = node.props.definition.schema
      node.props.definition.schema = (extensions: Record<string, any>) => {
        // Add password meter UI to extensions
        if (!extensions.suffix) {
          extensions.suffix = {
            $el: 'div',
            attrs: {
              class: 'formkit-password-meter',
              'data-position': meterOptions.position
            },
            children: [
              {
                $el: 'div',
                attrs: {
                  class: 'formkit-password-meter-indicator'
                }
              },
              {
                $el: 'span',
                attrs: {
                  class: 'formkit-password-meter-label'
                }
              }
            ]
          }
        }

        return typeof originalSchema === 'function'
          ? originalSchema(extensions)
          : originalSchema
      }
    }

    // Add password strength check handler
    node.on('input', ({ payload }) => {
      const value = payload as string
      let strength = 'weak'
      let label = meterOptions.weakLabel

      if (new RegExp(meterOptions.strongRegex!).test(value)) {
        strength = 'strong'
        label = meterOptions.strongLabel
      } else if (new RegExp(meterOptions.mediumRegex!).test(value)) {
        strength = 'medium'
        label = meterOptions.mediumLabel
      }

      // Update UI using node's context
      const context = node.props.context as FormKitContext | undefined
      const meter = context?.sections?.suffix?.querySelector('.formkit-password-meter')
      if (meter instanceof HTMLElement) {
        meter.setAttribute('data-strength', strength)
        const labelEl = meter.querySelector('.formkit-password-meter-label')
        if (labelEl) {
          labelEl.textContent = label
        }
      }
    })
  }
}
