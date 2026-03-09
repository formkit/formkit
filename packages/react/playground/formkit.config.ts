import { genesisIcons } from '@formkit/icons'
import type { DefaultConfigOptions } from '@formkit/react'
import { rootClasses } from './formkit.theme'

const config: DefaultConfigOptions = {
  icons: { ...genesisIcons },
  config: {
    rootClasses,
  },
}

export default config
