import type { NodePath } from '@babel/traverse'
import type { ArrayExpression, ObjectExpression } from '@babel/types'
import type { ComponentUse, UsedFeatures } from '../types'
import {
  createFeats,
  extractUsedFeaturesInSchema,
  importIcons,
  importLocales,
  importValidation,
} from './formkit'
import { addImport, createProperty, extract, loadFromAST } from './ast'
import tcjs from '@babel/template'
import { camel } from '@formkit/vue/utils'
import type { FormKitSchemaDefinition } from '@formkit/vue/core'
import consola from 'consola'
import { isRef } from 'vue'
import { isReactive } from 'vue'
import { getInputDefinition } from './config'
const t: typeof tcjs = ('default' in tcjs ? tcjs.default : tcjs) as typeof tcjs

/**
 * Given a ComponentUse, this function will configure the FormKitSchema instance.
 * @param component - The use of the FormKitSchema component.
 * @returns
 */
export async function configureFormKitSchemaInstance(component: ComponentUse) {
  let props = component.path.get('arguments.1') as
    | NodePath<ObjectExpression>
    | undefined
  if (!props || Array.isArray(props) || !props.isObjectExpression()) {
    component.path.node.arguments[1] = t.expression.ast`{}`
    props = component.path.get('arguments.1') as NodePath<ObjectExpression>
  }

  if (!component.opts.optimize.schema) {
    // schemas are de-optimized. Inject the default config only.
    return props.node.properties.push(
      createProperty('__config__', {
        type: 'Identifier',
        name: addImport(component.opts, component.root, {
          from: 'virtual:formkit/defaultConfig',
          name: 'defaultConfig',
        }),
      })
    )
  }

  const schema = props.get('properties').find((prop) => {
    const key = prop.get('key')
    if (!Array.isArray(key) && key.isIdentifier({ name: 'schema' })) {
      return true
    }
    return false
  })
  const schemaValue = schema?.get('value')

  if (
    schemaValue &&
    !Array.isArray(schemaValue) &&
    (schemaValue.isObjectExpression() ||
      schemaValue.isArrayExpression() ||
      schemaValue.isIdentifier() ||
      schemaValue.isMemberExpression() ||
      schemaValue.isCallExpression())
  ) {
    const file = extract(schemaValue, true)
    file.program.body.push(t.statement.ast`export { __extracted__ }`)
    const loaded = await loadFromAST(component.opts, file, component.id)
    if (
      loaded &&
      loaded.__extracted__ &&
      typeof loaded.__extracted__ === 'object'
    ) {
      if (isRef(loaded.__extracted__) || isReactive(loaded.__extracted__)) {
        consola.warn(
          '[FormKit] Found a schema defined with ref() or reactive(). These cannot be optimized.'
        )
      } else {
        // We found an inline schema, let’s handle it here...
        return await createSchemaConfig(component, props, loaded.__extracted__)
      }
    }
  } else if (!schemaValue) {
    consola.warn(
      '[FormKit] <FormKitSchema> component found with no schema prop.'
    )
    return
  }
  consola.warn(
    '[FormKit de-opt] Could not statically analyze schema, de-optimizing.'
  )
  props.node.properties.push(
    createProperty('__config__', {
      type: 'Identifier',
      name: addImport(component.opts, component.root, {
        from: 'virtual:formkit/defaultConfig',
        name: 'defaultConfig',
      }),
    })
  )
}

/**
 * Creates a custom configuration for a FormKitSchema component assuming the schema is
 * statically anayzable.
 * @param component - The use of the FormKitSchema component.
 * @param props - The props of the FormKitSchema component.
 * @param schema - The schema (path) of the FormKitSchema component.
 */
async function createSchemaConfig(
  component: ComponentUse,
  props: NodePath<ObjectExpression>,
  schema: FormKitSchemaDefinition
) {
  const feats = createFeats()
  // faux "component props" that don’t really apply to FormKit Schema but are needed
  // for <FormKit> component introspection.
  const fauxProps = t.expression.ast`{}` as ObjectExpression
  const config = t.expression.ast`{}` as ObjectExpression
  const plugins = t.expression.ast`[]` as ArrayExpression
  const nodeProps = t.expression.ast`{}` as ObjectExpression

  await extractUsedFeaturesInSchema(schema, feats, component.opts)

  /**
   * Inject the bindings plugin:
   */
  plugins.elements.push(
    t.expression.ast`${addImport(component.opts, component.root, {
      name: 'bindings',
      from: `@formkit/vue`,
    })}`
  )

  /**
   * Inject libraries for all the required inputs:
   */
  for (const inputType of feats.inputs) {
    const def = await getInputDefinition(component.opts, inputType)
    if (!def || !('__isFromLibrary' in def)) {
      plugins.elements.push(
        t.expression.ast`${addImport(component.opts, component.root, {
          name: 'library',
          from: `virtual:formkit/inputs:${inputType}`,
        })}`
      )
    }
  }

  // Inject the validation plugin and any rules
  await importValidation(component, fauxProps, nodeProps, plugins, feats.rules)

  // Import the necessary i18n locales
  await importLocales(
    component,
    nodeProps,
    plugins,
    new Set([...feats.rules, ...feats.localizations])
  )

  await importIcons(component, nodeProps, plugins, fauxProps, feats.icons)

  importSchemaClasses(component, config, feats)

  config.properties.push(createProperty('props', nodeProps))
  config.properties.push(createProperty('plugins', plugins))
  const nodeOptions = addImport(component.opts, component.root, {
    from: 'virtual:formkit/nodeOptions',
    name: 'nodeOptions',
  })
  props.node.properties.push(
    createProperty('__config__', t.expression.ast`${nodeOptions}(${config})`)
  )
}

/**
 * The FormKitSchema component.
 * @param component - The component use
 * @param config - The configuration object
 * @param feats - The features being used
 * @returns
 */
function importSchemaClasses(
  component: ComponentUse,
  config: ObjectExpression,
  feats: UsedFeatures
) {
  if (!component.opts.optimize.theme) return
  const classes = t.expression.ast`[]` as ArrayExpression
  for (const inputType of feats.inputs) {
    classes.elements.push(
      t.expression.ast`${addImport(component.opts, component.root, {
        from: 'virtual:formkit/classes:' + inputType,
        name: `${camel(inputType)}Classes`,
      })}`
    )
  }
  const merge = addImport(component.opts, component.root, {
    from: 'virtual:formkit/merge-rootClasses',
    name: `mergeRootClasses`,
  })
  const nodeConfig = t.expression.ast`{}` as ObjectExpression
  nodeConfig.properties.push(
    createProperty('rootClasses', t.expression.ast`${merge}(${classes})`)
  )
  config.properties.push(createProperty('config', nodeConfig))
}
