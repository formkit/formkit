import type { Preset, Variant } from 'unocss'

const actionsVariants: Variant = (matcher) => {
  const match = matcher.match(/^formkit-action[:-]/)

  if (!match) return matcher;

  return {
    matcher: matcher.slice(match[0].length),
    selector: s => `.formkit-actions ${s}, .formkit-actions${s}`
  }
}

const attributesVariants: Variant = (matcher) => {
  const match = matcher.match(/^formkit-([_\d\w]+)[:-]/)

  if (!match) return matcher;

  return {
    matcher: matcher.slice(match[0].length),
    selector: s => `${s}[data-${match[1]}], [data-${match[1]}] ${s}, [data-${match[1]}]${s}`
  }
}

const messageStatesVariants: Variant = (matcher) => {
  const match = matcher.match(/^formkit-message-([_\d\w]+)[:-]/)

  if (!match) return matcher;

  return {
    matcher: matcher.slice(match[0].length),
    selector: s => `[data-message-type="${match[1]}"] ${s}, [data-message-type="${match[1]}"]${s}`
  }
}

const FormKitVariants = (): Preset => {
  return {
    name: 'unocss-preset-formkit',
    variants: [
      actionsVariants,
      attributesVariants,
      messageStatesVariants
    ]
  }
}

export default FormKitVariants
