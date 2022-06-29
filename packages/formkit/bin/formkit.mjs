#!/usr/bin/env node
import('@formkit/cli').then((init) =>
  typeof init === 'function' ? init() : init.default()
)
