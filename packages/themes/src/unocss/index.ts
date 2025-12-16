/**
 * Minimal type definitions for UnoCSS compatibility.
 * These match the UnoCSS API without requiring unocss as a dependency.
 */
interface VariantMatchResult {
  matcher: string
  selector?: (input: string) => string
}

type Variant = (matcher: string) => string | VariantMatchResult

interface Preset {
  name: string
  variants?: Variant[]
}

const outerAttributes = [
  'disabled',
  'invalid',
  'errors',
  'complete',
  'loading',
  'submitted',
  'checked',
  'multiple',
  'prefix-icon',
  'suffix-icon',
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
