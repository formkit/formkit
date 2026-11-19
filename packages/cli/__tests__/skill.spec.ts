import { mkdtemp, readFile, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join, resolve } from 'pathe'
import { describe, expect, it, vi } from 'vitest'
import {
  detectProjectRuntime,
  enableAgentsForProject,
  installFormKitSkill,
  renderProjectInstructionSection,
  setupSkill,
  upsertBoundedSection,
} from '../src/skill'
import {
  buildDocsReferenceMarkdown,
  collectDocsRoutes,
  formKitDocsUrl,
} from '../src/skillDocs'

const packageRoot = resolve(process.cwd(), process.cwd().endsWith('packages/cli') ? '.' : 'packages/cli')

describe('FormKit skill docs helpers', () => {
  it('collects public docs routes and excludes hidden pages', async () => {
    const docsRoot = resolve(packageRoot, '__tests__/mocks/docs-content')
    const routes = await collectDocsRoutes(docsRoot)

    expect(routes.map((route) => route.route)).toEqual([
      '/getting-started/installation',
      '/essentials/architecture',
      '/inputs/text',
      '/plugins/zod',
      '/api-reference/context',
    ])
  })

  it('builds runtime-specific docs urls', () => {
    expect(formKitDocsUrl('/inputs/repeater', 'react')).toBe(
      'https://formkit.com/inputs/repeater.react.md'
    )
    expect(formKitDocsUrl('/essentials/architecture', 'vue')).toBe(
      'https://formkit.com/essentials/architecture.vue.md'
    )
  })

  it('renders docs reference markdown with both runtimes', async () => {
    const docsRoot = resolve(packageRoot, '__tests__/mocks/docs-content')
    const routes = await collectDocsRoutes(docsRoot)
    const markdown = buildDocsReferenceMarkdown(routes)

    expect(markdown).toContain('## Inputs')
    expect(markdown).toContain(
      'https://formkit.com/inputs/text.react.md'
    )
    expect(markdown).toContain(
      'https://formkit.com/inputs/text.vue.md'
    )
    expect(markdown).not.toContain('.hidden')
  })

  it('ships a generated docs index with key pages', async () => {
    const docsIndex = await readFile(
      resolve(packageRoot, 'assets/skills/formkit/references/docs-index.md'),
      'utf8'
    )

    expect(docsIndex).toContain(
      'https://formkit.com/essentials/architecture.react.md'
    )
    expect(docsIndex).toContain(
      'https://formkit.com/inputs/repeater.vue.md'
    )
    expect(docsIndex).toContain(
      'https://formkit.com/inputs/form.react.md'
    )
  })
})

describe('FormKit skill installation', () => {
  it('detects React and Vue runtimes from package.json', async () => {
    const reactDir = await mkdtemp(join(tmpdir(), 'formkit-react-'))
    const vueDir = await mkdtemp(join(tmpdir(), 'formkit-vue-'))
    const ambiguousDir = await mkdtemp(join(tmpdir(), 'formkit-ambiguous-'))

    await writeFile(
      join(reactDir, 'package.json'),
      JSON.stringify({ dependencies: { react: '^19.0.0' } }, null, 2),
      'utf8'
    )
    await writeFile(
      join(vueDir, 'package.json'),
      JSON.stringify({ dependencies: { vue: '^3.5.0', nuxt: '^3.0.0' } }, null, 2),
      'utf8'
    )
    await writeFile(
      join(ambiguousDir, 'package.json'),
      JSON.stringify(
        { dependencies: { react: '^19.0.0', vue: '^3.5.0' } },
        null,
        2
      ),
      'utf8'
    )

    await expect(detectProjectRuntime(reactDir)).resolves.toBe('react')
    await expect(detectProjectRuntime(vueDir)).resolves.toBe('vue')
    await expect(detectProjectRuntime(ambiguousDir)).resolves.toBeNull()
  })

  it('installs the skill into a Codex home directory', async () => {
    const codexHome = await mkdtemp(join(tmpdir(), 'codex-home-'))
    const skillPath = await installFormKitSkill({ codexHome })

    const skill = await readFile(join(skillPath, 'SKILL.md'), 'utf8')

    expect(skill).toContain('# FormKit')
    expect(skill).toContain('Tailwind CSS 4')
    expect(skill).toContain('formkit theme --theme=regenesis')
    expect(skill).toContain('For non-interactive Regenesis setup')
    expect(skill).toContain('Current Pro input docs routes')
    expect(skill).toContain('https://pro.formkit.com')
    expect(skill).toContain('@formkit/pro')
    expect(skill).toContain('Whenever you use or recommend a Pro input')
    expect(skill).toContain('node.setErrors()')
    expect(skill).toContain('group.list.2.name')
    await expect(
      readFile(join(skillPath, 'agents/openai.yaml'), 'utf8')
    ).resolves.toContain('display_name: "FormKit"')
    await expect(
      readFile(join(skillPath, 'references/docs-index.md'), 'utf8')
    ).resolves.toContain('https://formkit.com/inputs/text.react.md')
  })

  it('updates AGENTS.md and CLAUDE.md and returns manual instructions', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'formkit-project-'))
    const skillPath = resolve(packageRoot, 'assets/skills/formkit')

    const result = await enableAgentsForProject({
      agents: ['codex', 'claude-code', 'cursor'],
      projectRoot,
      runtime: 'react',
      skillPath,
    })

    const agentsMd = await readFile(join(projectRoot, 'AGENTS.md'), 'utf8')
    const claudeMd = await readFile(join(projectRoot, 'CLAUDE.md'), 'utf8')

    expect(agentsMd).toContain('<!-- formkit-skill:start -->')
    expect(agentsMd).toContain('https://formkit.com/<page>.react.md')
    expect(agentsMd).toContain('Tailwind CSS 4')
    expect(agentsMd).toContain('formkit theme --theme=regenesis')
    expect(agentsMd).toContain('non-interactive way')
    expect(agentsMd).toContain('Current Pro routes')
    expect(agentsMd).toContain('https://pro.formkit.com')
    expect(agentsMd).toContain('@formkit/pro')
    expect(agentsMd).toContain('user-facing summary')
    expect(agentsMd).toContain('node.setErrors()')
    expect(claudeMd).toContain('Use the `formkit` skill')
    expect(result.updatedFiles).toEqual([
      join(projectRoot, 'AGENTS.md'),
      join(projectRoot, 'CLAUDE.md'),
    ])
    expect(result.manualInstructions).toHaveLength(1)
    expect(result.manualInstructions[0]).toContain('Cursor')
  })

  it('upserts a bounded section idempotently', () => {
    const section = renderProjectInstructionSection(
      'vue',
      '/Users/test/.codex/skills/formkit'
    )
    const once = upsertBoundedSection('# Project\n', section)
    const twice = upsertBoundedSection(once, section)

    expect(once).toBe(twice)
    expect(twice.match(/formkit-skill:start/gu)).toHaveLength(1)
  })

  describe('consent for project instruction files (#1828)', () => {
    async function runSetup(options: Record<string, unknown>) {
      const projectRoot = await mkdtemp(join(tmpdir(), 'formkit-consent-'))
      const codexHome = await mkdtemp(join(tmpdir(), 'codex-home-'))
      const prevHome = process.env.CODEX_HOME
      const stdinTTY = process.stdin.isTTY
      process.env.CODEX_HOME = codexHome
      // Simulate an agent / CI shell (no TTY)
      Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true })
      const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
      try {
        await setupSkill({ ...options, cwd: projectRoot })
      } finally {
        log.mockRestore()
        Object.defineProperty(process.stdin, 'isTTY', { value: stdinTTY, configurable: true })
        if (prevHome === undefined) delete process.env.CODEX_HOME
        else process.env.CODEX_HOME = prevHome
      }
      return { projectRoot, codexHome, log }
    }

    it('never edits AGENTS.md/CLAUDE.md non-interactively without --yes', async () => {
      const { projectRoot, codexHome } = await runSetup({
        agents: 'codex,claude-code',
      })
      await expect(readFile(join(projectRoot, 'AGENTS.md'), 'utf8')).rejects.toThrow()
      await expect(readFile(join(projectRoot, 'CLAUDE.md'), 'utf8')).rejects.toThrow()
      // The skill itself is still installed
      await expect(
        readFile(join(codexHome, 'skills/formkit/SKILL.md'), 'utf8')
      ).resolves.toContain('# FormKit')
    })

    it('edits them with explicit --agents and --yes', async () => {
      const { projectRoot } = await runSetup({ agents: 'codex', yes: true })
      await expect(readFile(join(projectRoot, 'AGENTS.md'), 'utf8')).resolves.toContain(
        '<!-- formkit-skill:start -->'
      )
      await expect(readFile(join(projectRoot, 'CLAUDE.md'), 'utf8')).rejects.toThrow()
    })

    it('does not touch project files when no agents are given', async () => {
      const { projectRoot } = await runSetup({})
      await expect(readFile(join(projectRoot, 'AGENTS.md'), 'utf8')).rejects.toThrow()
    })

    it('pins the refresh command to the installing CLI version', async () => {
      const codexHome = await mkdtemp(join(tmpdir(), 'codex-home-'))
      const skillPath = await installFormKitSkill({ codexHome, version: '9.9.9' })
      const skill = await readFile(join(skillPath, 'SKILL.md'), 'utf8')
      expect(skill).toContain('npx formkit@9.9.9 skill')
      expect(skill).not.toContain('npx formkit skill')
    })
  })
})
