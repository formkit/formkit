import {
  FormKitNode,
  FormKitPlugin,
  FormKitSchemaNode,
  FormKitSchemaCondition,
} from '@formkit/core'
import { clone, undefine } from '@formkit/utils'

/**
 * The options to be passed to {@link createInputCountPlugin | createInputCountPlugin}
 *
 * @public
 */
export interface InputCountOptions {
  useAsDefault?: boolean,
  countTypes?: string[]
}

/**
 * Creates a new input count plugin.
 *
 * @param InputCountOptions - The options of {@link InputCountOptions | InputCountOptions} to pass to the plugin
 *
 * @returns A {@link @formkit/core#FormKitPlugin | FormKitPlugin}
 *
 * @public
 */
export function createInputCountPlugin(
  InputCountOptions?: InputCountOptions
): FormKitPlugin {
  return (node: FormKitNode) => {
    node.addProps(['inputCount', 'inputCountString'])

    const allowTypes = InputCountOptions?.countTypes || ['text', 'password', 'textarea']

    const useInputCount = undefine(node.props.inputCount) ||
      node.props.inputCount === 'true' ||
      node.props.inputCount === true ||
      InputCountOptions?.useAsDefault === true

    if (useInputCount) {
      node.on('created', () => {
        if (!node.props || !node.props.definition) return
        const inputDefinition = clone(node.props.definition)
        if (allowTypes.includes(node.props.type)) {
          const originalSchema = inputDefinition.schema
          if (typeof originalSchema !== 'function') return

          node.props.inputCountString = ''

          const higherOrderSchema = (
            extensions: Record<
              string,
              Partial<FormKitSchemaNode> | FormKitSchemaCondition
            >
          ) => {
            extensions.help = {
              if: 'true',
              children: [
                {
                  $el: 'span',
                  children: `$inputCountString`,
                  attrs: {
                    class: '$classes.inputCounter',
                  }
                },
                "$help || ''"
              ]
            }

            return originalSchema(extensions)
          }

          inputDefinition.schema = higherOrderSchema
          if (inputDefinition.schemaMemoKey) {
            inputDefinition.schemaMemoKey += '-input-count'
          }
          node.props.definition = inputDefinition

          let maxLength = getMaxLength()

          node.on('input', updateCountValue)
          node.on('prop:parsedRules', () => {
            maxLength = getMaxLength()
            // re-run the count value
            updateCountValue({ payload: node._value as string })
          })

          function updateCountValue ({ payload }: { payload: string }) {
            node.props.inputCountString = `${payload ? payload.length : 0}${maxLength ? `/${maxLength}` : ''}`
          }

          function getMaxLength () {
            const rules = node.props.parsedRules
            if (rules && rules.length > 0) {
              const maxLengthRule = rules.find(
                (rule: { name: string, args: object[] }) => rule.name === 'length' && rule.args && rule.args.length > 1
              )
              if (maxLengthRule) {
                return parseInt(maxLengthRule.args[1])
              }
            }
            return null
          }
        }
      })
    }
  }
}