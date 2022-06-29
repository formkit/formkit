#!/usr/bin/env node
import('../dist/index.mjs').then((init) =>
  typeof init === 'function' ? init() : init.default()
)
