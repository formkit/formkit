import type { Preset, Variant } from 'unocss'

const outerAttributes = [
  'disabled',
  'invalid',
  'errors',
  'complete',
  'loading',
  'submitted',
  'multiple',
  'has-prefix-icon',
  'has-suffix-icon',
]

const attributesVariants: Variant = (matcher) => {
  const match = matcher.match(
    new RegExp(`^formkit-(${outerAttributes.join('|')})(/[_\\d\\w]+)?[:-]`)
  )

  if (!match) return matcher

  return {
    matcher: matcher.slice(match[0].length),
    selector: (s) => {
      if (match[2]) {
        return `
          [data-${match[1]}="true"].group\\${match[2]}${s},
          [data-${match[1]}="true"].group\\${match[2]} ${s}
        `
      }
      return `
      	[data-${match[1]}="true"]:not([data-type='repeater'])${s},
        [data-${match[1]}="true"]:not([data-type='repeater']) ${s}
      `
    },
  }
}

/**
 * The FormKit plugin for UnoCSS
 * @public
 */
const FormKitVariants = (): Preset => {
  return {
    name: 'unocss-preset-formkit',
    variants: [attributesVariants],
  }
}

export default FormKitVariants
