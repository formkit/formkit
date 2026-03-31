import { mkdir, writeFile } from 'fs/promises'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import jiti from 'jiti'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const require = jiti(import.meta.url)
const { buildDocsReferenceMarkdown, collectDocsRoutes } = require(
  '../src/skillDocs.ts'
)

const docsContentRoot = resolve(__dirname, '../../../../docs-content')
const outputPath = resolve(
  __dirname,
  '../assets/skills/formkit/references/docs-index.md'
)

const routes = await collectDocsRoutes(docsContentRoot)
const markdown = buildDocsReferenceMarkdown(routes)

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, markdown, 'utf8')
