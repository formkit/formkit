import { access, cp, mkdir, readFile, rm, writeFile } from 'fs/promises'
import { homedir } from 'os'
import prompts, { PromptObject } from 'prompts'
import { dirname, join, resolve } from 'pathe'
import { fileURLToPath } from 'url'
import { execa } from 'execa'
import chalk from 'chalk'
import type { FormKitRuntime } from './skillDocs'

export interface SupportedAgent {
  id: string
  label: string
}

export interface ProjectEnablementResult {
  manualInstructions: Array<string>
  updatedFiles: Array<string>
}

export const SUPPORTED_AGENTS: Array<SupportedAgent> = [
  { id: 'claude-code', label: 'Claude Code' },
  { id: 'opencode', label: 'OpenCode' },
  { id: 'codex', label: 'Codex' },
  { id: 'cline', label: 'Cline' },
  { id: 'gemini', label: 'Gemini' },
  { id: 'qwen', label: 'Qwen' },
  { id: 'amp', label: 'Amp' },
  { id: 'pi', label: 'pi' },
  { id: 'cursor', label: 'Cursor' },
  { id: 'copilot', label: 'Copilot' },
  { id: 'crush', label: 'Crush' },
]

const FORMKIT_PRO_INPUT_ROUTES = [
  '/inputs/autocomplete',
  '/inputs/colorpicker',
  '/inputs/currency',
  '/inputs/datepicker',
  '/inputs/dropdown',
  '/inputs/mask',
  '/inputs/rating',
  '/inputs/repeater',
  '/inputs/slider',
  '/inputs/taglist',
  '/inputs/toggle',
  '/inputs/togglebuttons',
  '/inputs/transfer-list',
  '/inputs/unit',
].join(', ')

const AUTO_ENABLE_FILES: Record<string, string> = {
  'claude-code': 'CLAUDE.md',
  codex: 'AGENTS.md',
}

const FORMKIT_SECTION_START = '<!-- formkit-skill:start -->'
const FORMKIT_SECTION_END = '<!-- formkit-skill:end -->'

export async function setupSkill(): Promise<void> {
  try {
    const projectRoot = await resolveProjectRoot(process.cwd())
    const detectedRuntime =
      (await detectProjectRuntime(process.cwd())) ??
      (projectRoot === process.cwd()
        ? null
        : await detectProjectRuntime(projectRoot))
    const questions: Array<PromptObject<'runtime' | 'agents'>> = []

    if (!detectedRuntime) {
      questions.push({
        type: 'select',
        name: 'runtime',
        message: 'Which FormKit runtime should this project use by default?',
        choices: [
          { title: 'React / Astro (React)', value: 'react' },
          { title: 'Vue / Nuxt', value: 'vue' },
        ],
        initial: 0,
      })
    }

    questions.push({
      type: 'multiselect',
      name: 'agents',
      message: 'Enable FormKit guidance on this project for which coding agents?',
      choices: SUPPORTED_AGENTS.map((agent) => ({
        title: agent.label,
        value: agent.id,
        selected: agent.id === 'codex',
      })),
      instructions: false,
      min: 0,
    })

    const response = await prompts(questions, {
      onCancel: () => {
        throw new Error('cancelled')
      },
    })

    const runtime = (detectedRuntime ?? response.runtime) as FormKitRuntime
    const selectedAgents = (response.agents ?? []) as Array<string>
    const skillPath = await installFormKitSkill()
    const enablement = await enableAgentsForProject({
      agents: selectedAgents,
      projectRoot,
      runtime,
      skillPath,
    })

    printSummary({
      enablement,
      projectRoot,
      runtime,
      selectedAgents,
      skillPath,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'cancelled') {
      console.log(chalk.yellow('FormKit skill installation cancelled.'))
      return
    }
    throw error
  }
}

export async function detectProjectRuntime(
  startDir: string
): Promise<FormKitRuntime | null> {
  const packageJsonPath = await findNearestPackageJson(startDir)
  if (!packageJsonPath) return null

  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'))
  const deps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
    ...packageJson.optionalDependencies,
    ...packageJson.peerDependencies,
  }

  const hasReact = Boolean(
    deps.react || deps['react-dom'] || deps['@formkit/react'] || deps.astro
  )
  const hasVue = Boolean(
    deps.vue || deps.nuxt || deps['@formkit/vue'] || deps['@formkit/nuxt']
  )

  if (hasReact === hasVue) return null
  return hasReact ? 'react' : 'vue'
}

export async function installFormKitSkill(options: {
  codexHome?: string
  sourceDir?: string
} = {}): Promise<string> {
  const sourceDir = options.sourceDir ?? (await getFormKitSkillSourceDir())
  const codexHome = options.codexHome ?? getCodexHome()
  const destination = resolve(codexHome, 'skills', 'formkit')

  await mkdir(dirname(destination), { recursive: true })
  await rm(destination, { recursive: true, force: true })
  await cp(sourceDir, destination, { recursive: true })

  return destination
}

export async function enableAgentsForProject(options: {
  agents: Array<string>
  projectRoot: string
  runtime: FormKitRuntime
  skillPath: string
}): Promise<ProjectEnablementResult> {
  const result: ProjectEnablementResult = {
    manualInstructions: [],
    updatedFiles: [],
  }

  for (const agentId of options.agents) {
    const autoEnableFile = AUTO_ENABLE_FILES[agentId]
    const agent = SUPPORTED_AGENTS.find((candidate) => candidate.id === agentId)
    if (!agent) continue

    if (!autoEnableFile) {
      result.manualInstructions.push(
        renderManualEnablementInstructions(agent, options.runtime, options.skillPath)
      )
      continue
    }

    const filePath = resolve(options.projectRoot, autoEnableFile)
    await upsertProjectEnablementFile(filePath, options.runtime, options.skillPath)
    result.updatedFiles.push(filePath)
  }

  return result
}

export function renderProjectInstructionSection(
  runtime: FormKitRuntime,
  skillPath: string
): string {
  const runtimeUrl =
    runtime === 'react'
      ? 'https://formkit.com/<page>.react.md'
      : 'https://formkit.com/<page>.vue.md'

  return [
    '## FormKit',
    `Use the \`formkit\` skill for FormKit work in this project.`,
    `- Skill file: \`${join(skillPath, 'SKILL.md')}\``,
    `- Docs index: \`${join(skillPath, 'references/docs-index.md')}\``,
    `- Default runtime docs: \`${runtimeUrl}\``,
    '- Prefer declarative FormKit patterns. Avoid event listeners unless there is no node- or state-driven alternative.',
    '- Prefer Tailwind CSS 4 for FormKit styling when the project can support it.',
    '- Avoid Genesis by default. Prefer generating Regenesis with `formkit theme --theme=regenesis`.',
    '- `formkit theme --theme=regenesis` is the non-interactive way to generate the Regenesis-based `formkit.theme` file.',
    '- For theme setup, wire `rootClasses` from `./formkit.theme` and add the `formkit.theme` file to Tailwind 4 via `@source` in the main CSS entry.',
    `- Distinguish core inputs from Pro inputs. Current Pro routes: ${FORMKIT_PRO_INPUT_ROUTES}.`,
    '- Pro inputs require `@formkit/pro` and a FormKit Pro key from `https://pro.formkit.com`.',
    '- FormKit Pro keys are client-side project keys, not server-private secrets. Prefer hard-coded codebase config or another intentional client-exposed config surface.',
    '- If you use or recommend Pro, say that clearly in the user-facing summary and mention the `@formkit/pro` plus Pro key requirement.',
    '- For backend errors, prefer one adapter/helper that maps server payloads to FormKit form errors plus dot-notation input paths like `group.name` or `group.list.2.name`, then call `node.setErrors()` or framework `setErrors()`.',
  ].join('\n')
}

export function renderManualEnablementInstructions(
  agent: SupportedAgent,
  runtime: FormKitRuntime,
  skillPath: string
): string {
  return [
    `${agent.label}: add this to the agent's project instructions or memory for the repository:`,
    '```md',
    renderProjectInstructionSection(runtime, skillPath),
    '```',
  ].join('\n')
}

export function upsertBoundedSection(
  source: string,
  section: string
): string {
  const boundedSection = [
    FORMKIT_SECTION_START,
    section.trim(),
    FORMKIT_SECTION_END,
  ].join('\n')
  const matcher = new RegExp(
    `${escapeForRegex(FORMKIT_SECTION_START)}[\\s\\S]*?${escapeForRegex(
      FORMKIT_SECTION_END
    )}`,
    'u'
  )

  if (matcher.test(source)) {
    return source.replace(matcher, boundedSection)
  }

  if (!source.trim()) {
    return `${boundedSection}\n`
  }

  return `${source.replace(/\s*$/u, '')}\n\n${boundedSection}\n`
}

async function upsertProjectEnablementFile(
  filePath: string,
  runtime: FormKitRuntime,
  skillPath: string
): Promise<void> {
  const existing = (await tryRead(filePath)) ?? ''
  const next = upsertBoundedSection(
    existing,
    renderProjectInstructionSection(runtime, skillPath)
  )
  await writeFile(filePath, next, 'utf8')
}

async function resolveProjectRoot(cwd: string): Promise<string> {
  try {
    const result = await execa('git', ['rev-parse', '--show-toplevel'], { cwd })
    return result.stdout.trim() || cwd
  } catch {
    return cwd
  }
}

async function findNearestPackageJson(startDir: string): Promise<string | null> {
  let current = resolve(startDir)

  while (true) {
    const candidate = resolve(current, 'package.json')
    if (await pathExists(candidate)) {
      return candidate
    }

    const parent = dirname(current)
    if (parent === current) {
      return null
    }

    current = parent
  }
}

function getCodexHome(): string {
  return resolve(process.env.CODEX_HOME || join(homedir(), '.codex'))
}

async function getFormKitSkillSourceDir(): Promise<string> {
  const fileUrl = new URL('../assets/skills/formkit', import.meta.url)

  if (fileUrl.protocol === 'file:') {
    return fileURLToPath(fileUrl)
  }

  const candidates = [
    resolve(process.cwd(), 'packages/cli/assets/skills/formkit'),
    resolve(process.cwd(), 'assets/skills/formkit'),
  ]

  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      return candidate
    }
  }

  throw new Error('Unable to locate the bundled FormKit skill assets.')
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function tryRead(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf8')
  } catch {
    return null
  }
}

function printSummary(options: {
  enablement: ProjectEnablementResult
  projectRoot: string
  runtime: FormKitRuntime
  selectedAgents: Array<string>
  skillPath: string
}): void {
  console.log(chalk.greenBright(`Installed FormKit skill at ${options.skillPath}`))
  console.log(
    chalk.blue(
      `Using ${options.runtime === 'react' ? 'React' : 'Vue/Nuxt'} docs by default for ${options.projectRoot}`
    )
  )

  if (options.enablement.updatedFiles.length) {
    console.log(
      chalk.greenBright(
        `Updated project instructions: ${options.enablement.updatedFiles.join(', ')}`
      )
    )
  }

  const manualAgents = options.selectedAgents
    .filter((agentId) => !(agentId in AUTO_ENABLE_FILES))
    .map((agentId) => SUPPORTED_AGENTS.find((agent) => agent.id === agentId)?.label)
    .filter(Boolean)

  if (manualAgents.length) {
    console.log(
      chalk.yellow(
        `Manual enablement is still required for: ${manualAgents.join(', ')}`
      )
    )
  }

  if (options.enablement.manualInstructions.length) {
    console.log('')
    for (const instructions of options.enablement.manualInstructions) {
      console.log(instructions)
      console.log('')
    }
  }

  console.log(
    chalk.blue(
      `FormKit docs index: ${join(options.skillPath, 'references/docs-index.md')}`
    )
  )
  console.log(chalk.blue('Restart Codex to pick up new skills.'))
}

function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')
}
