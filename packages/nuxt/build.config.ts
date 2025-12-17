import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  hooks: {
    'mkdist:entry:options'(_ctx, _entry, options) {
      // Override output extension to .mjs instead of .js
      options.format = 'esm'
      options.ext = 'mjs'
    },
  },
})
