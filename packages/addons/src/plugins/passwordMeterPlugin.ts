import { FormKitNode, FormKitPlugin, FormKitSchemaNode, FormKitSchemaCondition } from '@formkit/core'

interface PasswordMeterOptions {
  strongRegex?: string
  mediumRegex?: string
  weakLabel?: string
  mediumLabel?: string
  strongLabel?: string
}

const defaultOptions: Omit<PasswordMeterOptions, 'position'> = {
  strongRegex: '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@#$%^*!~]).{12,}$',
  mediumRegex: '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}$',
  weakLabel: 'Weak',
  mediumLabel: 'Medium',
  strongLabel: 'Strong',

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

    // Check if passwordMeter prop exists and is not false
    if (node.props.passwordMeter === false || !node.props.passwordMeter) return

    // Cast to remove position property if it exists from user options
    const meterOptions = typeof node.props.passwordMeter === 'object'
      ? { ...config, ...(node.props.passwordMeter as Omit<PasswordMeterOptions, 'position'>) }
      : config

    // Add password meter schema
    if (node.props.definition?.schema) {
      const originalSchema = node.props.definition.schema
      // Ensure originalSchema is a function before proceeding
      if (typeof originalSchema !== 'function') return;

      node.props.definition.schema = (extensions: Record<string, Partial<FormKitSchemaNode> | FormKitSchemaCondition>) => {

        // Define the meter element structure
        const meterElement: FormKitSchemaNode = {
          $el: 'div',
          // Use $if condition based on focus state
          $if: '$isFocused',
          attrs: {
            class: 'formkit-password-meter',
            'data-position': 'popup', // Hardcoded position
            'data-strength': '$strength', // Bind strength attribute from context
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
              },
              children: '$strengthLabel' // Use state variable from context
            }
          ]
        }

        // Add the meter element to the suffix section, preserving existing suffix content
        extensions.suffix = {
          children: [
            '$suffix || ""', // Render existing suffix content first
            meterElement      // Then render our meter element
          ]
        }

        // Add state variables needed by the meter element to the extensions
        extensions.strengthLabel = '' // Initialize label state in context
        extensions.strength = ''      // Initialize strength state in context

        // Call the original schema function with the modified extensions
        return originalSchema(extensions)
      }

      // Add a schema memo key modification if the original definition had one
      if (node.props.definition.schemaMemoKey) {
        node.props.definition.schemaMemoKey += '-password-meter'
      }
    }

    // Add password strength check handler
    node.on('input', ({ payload }) => {
      const value = payload as string
      let strength = ''
      let label = ''

      // Determine strength and label
      if (!value) {
        strength = ''
        label = ''
      } else if (new RegExp(meterOptions.strongRegex!).test(value)) {
        strength = 'strong'
        label = meterOptions.strongLabel || 'Strong'
      } else if (new RegExp(meterOptions.mediumRegex!).test(value)) {
        strength = 'medium'
        label = meterOptions.mediumLabel || 'Medium'
      } else {
        strength = 'weak'
        label = meterOptions.weakLabel || 'Weak'
      }

      // Update the node's context directly.
      if (node.context) {
        node.context.strength = strength;
        node.context.strengthLabel = label;
      }
    })

  }
}
