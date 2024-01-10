#!/usr/bin/env node
import jiti from 'jiti'
import { fileURLToPath } from 'node:url'
const __filename = fileURLToPath(import.meta.url)

jiti(__filename)('../dist/index.mjs').cli()
