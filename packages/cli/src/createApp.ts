import { execa, execaCommand } from 'execa'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { dirname, resolve } from 'path'
import { cwd } from 'node:process'
import prompts from 'prompts'
import { error, green, __dirname, info } from './index'
import ora from 'ora'
import http from 'http'
import open from 'open'
import { isDirEmpty, readPackageJSON, writePackageJSON } from './utils'
import { buildTheme } from './theme'

const APP_URL = 'https://pro.formkit.com'
interface CreateAppOptions {
  lang: 'ts' | 'js'
  framework: 'nuxt' | 'vite'
  pro?: string
}

async function login(): Promise<string> {
  const spinner = ora(`To login visit: ${APP_URL}/cli-login`).start()
  await open(`${APP_URL}/cli-login`)
  let server: http.Server | undefined
  const token = await new Promise<string>((resolve, reject) => {
    server = http
      .createServer((req, res) => {
        const urlObj = new URL(req.url as string, 'http://localhost')
        const token = urlObj.searchParams.get('token') ?? undefined

        if (token) {
          resolve(token)
          res.writeHead(302, {
            Location: `${APP_URL}/cli-login?success=true`,
          })
          res.end()
        } else {
          res.writeHead(302, {
            Location: `${APP_URL}/cli-login?success=false`,
          })
          reject('Login failed.')
        }
      })
      .listen(5479)
  })
  server?.close()
  spinner.stop()
  return token
}

async function createTeam(token: string) {
  const res = await prompts({
    type: 'text',
    name: 'name',
    message: 'Please enter a new team name:',
    initial: 'My team',
  })
  const response = await fetch(`${APP_URL}/api/teams`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      name: res.name,
    }),
  })
  return await response.json()
}

async function createProject(token: string, team: number) {
  const res = await prompts({
    type: 'text',
    name: 'name',
    message: 'Please enter a new project name:',
    initial: 'My new project',
  })
  const response = await fetch(`${APP_URL}/api/teams/${team}/projects`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      name: res.name,
      license: 'development',
    }),
  })
  if (!response.ok) {
    error('Failed to create project.')
  }
  const data = await response.json()
  if (data.data) {
    info(
      `Your project was created successfully with a development license — to upgrade to a production license visit ${APP_URL}`
    )
  }
  return data.data
}

async function selectProProject() {
  try {
    const token = (await login()) as string
    const spinner = ora('Fetching account...').start()
    const response = await fetch(`${APP_URL}/api/account`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })
    const data = await response.json()
    spinner.stop()

    const res = await prompts({
      type: 'select',
      name: 'team',
      message: 'Select a team:',
      choices: data.teams
        .map(
          (team: {
            id: number
            name: string
            projects: Array<{ name: string; api_key: string }>
          }) => ({
            title: team.name,
            value: team,
          })
        )
        .concat([{ title: 'Create a new team', value: 'new' }]),
    })

    if (res.team === 'new') {
      const team = await createTeam(token)
      const project = await createProject(token, team.id)
      return project.api_key
    } else {
      let { project } = await prompts({
        type: 'select',
        name: 'project',
        message: 'Select a project:',
        choices: res.team.projects
          .map((team: { id: number; name: string }) => ({
            title: team.name,
            value: team,
          }))
          .concat([{ title: 'Create a new project', value: 'new' }]),
      })

      if (project === 'new') {
        project = await createProject(token, res.team.id)
      }
      return project.api_key
    }
  } catch (err) {
    console.log(err)
    error('Login failed.')
  }
  return 'test'
}

export async function createApp(
  appName?: string,
  options: Partial<CreateAppOptions> = {}
): Promise<void> {
  if (!appName) {
    const res = await prompts({
      type: 'text',
      name: 'name',
      message: 'Please enter a directory name for the project:',
      initial: 'formkit-app',
    })
    appName = res.name as string
  }

  const isEmpty = await isDirEmpty(resolve(cwd(), `./${appName}`))
  if (!isEmpty) {
    error('Directory is not empty. Please choose a different name.')
  }

  if (!options.framework) {
    const res = await prompts({
      type: 'select',
      name: 'framework',
      message: 'What framework would you like to use?',
      choices: [
        { title: 'Vite', value: 'vite' },
        { title: 'Nuxt', value: 'nuxt' },
      ],
      initial: 1,
    })
    options.framework = res.framework as 'vite' | 'nuxt'
  }

  if (!options.lang && options.framework === 'vite') {
    const res = await prompts({
      type: 'select',
      name: 'lang',
      message: 'What language should be used?',
      choices: [
        { title: 'TypeScript', value: 'ts' },
        { title: 'JavaScript', value: 'js' },
      ],
      initial: 1,
    })
    options.lang = res.lang as 'ts' | 'js'
  }

  if (!options.pro) {
    const res = await prompts([
      {
        type: 'toggle',
        name: 'install_pro',
        message: 'Would you like to install FormKit Pro?',
        active: 'yes',
        initial: true,
        inactive: 'no',
      },
    ])
    if (res.install_pro) {
      options.pro = await selectProProject()
    }
  }

  if (options.framework === 'vite') {
    await execa('npx', [
      '--yes',
      'create-vite@latest',
      appName,
      '--template',
      `vue${options.lang === 'ts' ? '-ts' : ''}`,
    ])
    await tailwindConfigForVite(
      resolve(cwd(), `./${appName}`),
      options.lang === 'ts'
    )
    await addDependency(appName, '@formkit/vue', 'latest')
    await addDependency(appName, '@formkit/themes', 'latest')
    await addDependency(appName, '@formkit/core', 'latest')
    await addDependency(appName, '@formkit/icons', 'latest')
    await addDependency(appName, 'tailwindcss')
    await addDependency(appName, 'autoprefixer')
    await addDependency(appName, 'postcss')
    if (options.pro) {
      await addDependency(appName, '@formkit/pro')
    }
    await addInitialApp(
      appName,
      'src/App.vue',
      !!options.pro,
      options.lang === 'ts'
    )
    await writeFile(
      resolve(
        cwd(),
        `./${appName}/formkit.config.${options.lang ? 'ts' : 'mjs'}`
      ),
      buildFormKitConfig(options as CreateAppOptions)
    )
    await writeFile(
      resolve(cwd(), `./${appName}/src/main.${options.lang}`),
      buildMain()
    )

    await downloadTheme(appName, options.lang === 'ts')

    green(`Created ${appName}!

      To run your new app:
      📁 cd ${appName}
      ✅ npm install
      🚀 npm run dev
    `)
  } else {
    options.lang = 'ts'
    info('Fetching nuxi cli...')
    const subprocess = execaCommand(
      `npx --yes nuxi@latest init --no-install "${appName}"`,
      {
        cwd: process.cwd(),
        shell: true,
        stdio: 'inherit',
      }
    )
    subprocess.stdout?.pipe(process.stdout)
    subprocess.stderr?.pipe(process.stderr)
    await subprocess
    await writeFile(
      resolve(cwd(), `./${appName}/formkit.config.ts`),
      buildFormKitConfig(options as CreateAppOptions)
    )
    await addDependency(appName, '@formkit/nuxt', 'latest')
    await addDependency(appName, '@formkit/icons', 'latest')
    await addDependency(appName, '@formkit/core', 'latest')
    await addDependency(appName, '@formkit/vue', 'latest')
    await addDependency(appName, '@formkit/themes', 'latest')
    await addDependency(appName, 'tailwindcss', 'latest')
    await addDependency(appName, '@tailwindcss/vite', 'latest')
    if (options.pro) {
      await addDependency(appName, '@formkit/pro')
    }
    await downloadTheme(appName, true)
    await setupNuxtConfig(appName)
    await addInitialApp(
      appName,
      'app/app.vue',
      !!options.pro,
      options.lang === 'ts'
    )
  }

  process.exit()
}

async function addInitialApp(
  dirName: string,
  component: string,
  pro: boolean,
  ts: boolean
) {
  const appPath = resolve(cwd(), `./${dirName}/${component}`)
  // Ensure directory exists (for nested paths like app/app.vue)
  await mkdir(dirname(appPath), { recursive: true })
  await writeFile(
    appPath,
    `<script setup${ts ? ' lang="ts"' : ''}>
async function submit() {
  await new Promise(r => setTimeout(r, 1000))
  alert('Submitted! 🎉')
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-xl p-8 mx-auto my-16 max-w-[450px]">
    <img
      src="https://pro.formkit.com/logo.svg"
      alt="FormKit Logo"
      width="244"
      height="50"
      class="mx-auto mb-8 w-48"
    >
    <FormKit
      type="form"
      #default="{ value }"
      @submit="submit"
    >
      <FormKit
        type="text"
        name="name"
        label="Name"
        help="What do people call you?"
      />
      <FormKit
        type="checkbox"
        name="flavors"
        label="Favorite ice cream flavors"
        :options="{
          'vanilla': 'Vanilla',
          'chocolate': 'Chocolate',
          'strawberry': 'Strawberry',
          'mint-chocolate-chip': 'Mint Chocolate Chip',
          'rocky-road': 'Rocky Road',
          'cookie-dough': 'Cookie Dough',
          'pistachio': 'Pistachio',
        }"
        validation="required|min:2"
      />
      ${
        (pro &&
          `
      <FormKit
        type="repeater"
        name="invitees"
        label="Invitees"
        help="Who else should we invite to FormKit?"
      >
        <FormKit
          type="text"
          name="email"
          label="Email"
          validation="required|email"
        />
      </FormKit>`) ||
        ''
      }
      <FormKit
        type="checkbox"
        name="agree"
        label="I agree FormKit is the best form authoring framework."
      />
      <pre class="font-mono text-sm p-4 bg-slate-100 mb-4">{{ value }}</pre>
    </FormKit>
  </div>
</template>
`
  )
}

/**
 * Adds a dependency to a new project’s package.json file.
 * @param dirName - The directory to find a package.json
 * @param dependency - An npm dependency to add.
 */
async function addDependency(
  dirName: string,
  dependency: string,
  version = 'latest'
) {
  const packageJson = await readPackageJSON(dirName)
  if (!('dependencies' in packageJson)) {
    packageJson.dependencies = {}
  }
  packageJson.dependencies[dependency] = version
  await writePackageJSON(dirName, packageJson)
}

async function downloadTheme(appName: string, ts: boolean) {
  process.chdir(resolve(cwd(), `./${appName}`))
  await buildTheme({
    theme: 'regenesis',
    format: ts ? 'ts' : 'mjs',
  })
  process.chdir(resolve(cwd(), `../`))
}

async function tailwindConfigForVite(path: string, ts: boolean) {
  await writeFile(
    resolve(path, './postcss.config.cjs'),
    `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
  `
  )
  await writeFile(
    resolve(path, './tailwind.config.js'),
    `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.vue",
    "./formkit.theme.${ts ? 'ts' : 'mjs'}",
    "./formkit.config.${ts ? 'ts' : 'mjs'}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`
  )
  await writeFile(
    resolve(path, './src/assets/main.css'),
    `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\nbody {\n  @apply bg-gray-100;\n}\n`
  )
  let html = await readFile(resolve(path, './index.html'), 'utf-8')
  html = html.replace(
    '</head>',
    `  <link rel="stylesheet" href="/src/assets/main.css">\n  </head>`
  )
  await writeFile(resolve(path, './index.html'), html)
}

function buildMain() {
  return `import { createApp } from 'vue'
import { plugin, defaultConfig } from '@formkit/vue'
import App from './App.vue'
import formKitConfig from '../formkit.config'

const app = createApp(App)
app.use(plugin, defaultConfig(formKitConfig))
app.mount('#app')
`
}

/**
 * Sets up the Nuxt config with FormKit and Tailwind CSS 4.
 * Creates the main.css file and modifies nuxt.config.ts.
 */
async function setupNuxtConfig(dirName: string) {
  const projectPath = resolve(cwd(), `./${dirName}`)

  // Create app/assets/css/main.css
  const cssDir = resolve(projectPath, 'app/assets/css')
  await mkdir(cssDir, { recursive: true })
  await writeFile(
    resolve(cssDir, 'main.css'),
    `@import "tailwindcss";
@source "../../../formkit.theme.ts";
@source "../../../formkit.config.ts";

body {
  @apply bg-gray-100;
}
`
  )

  // Modify nuxt.config.ts
  const nuxtConfigPath = resolve(projectPath, 'nuxt.config.ts')
  let config = await readFile(nuxtConfigPath, 'utf-8')

  // Add tailwindcss import at the top if not present
  if (!config.includes('@tailwindcss/vite')) {
    config = `import tailwindcss from "@tailwindcss/vite";\n\n${config}`
  }

  // Find the defineNuxtConfig call and modify it
  // This regex captures the content inside defineNuxtConfig({ ... })
  const configMatch = config.match(/defineNuxtConfig\(\s*\{([\s\S]*?)\}\s*\)/)

  if (configMatch) {
    let configContent = configMatch[1]

    // Check if modules exists and add @formkit/nuxt
    if (configContent.includes('modules:')) {
      // Add to existing modules array
      configContent = configContent.replace(
        /modules:\s*\[([^\]]*)\]/,
        (_match, modules) => {
          const existingModules = modules.trim()
          if (existingModules) {
            return `modules: [\n    '@formkit/nuxt',\n    ${existingModules}\n  ]`
          }
          return `modules: [\n    '@formkit/nuxt',\n  ]`
        }
      )
    } else {
      // Add modules array
      configContent = addConfigProperty(configContent, `modules: [\n    '@formkit/nuxt',\n  ]`)
    }

    // Add css array if not present
    if (!configContent.includes('css:')) {
      configContent = addConfigProperty(configContent, `css: ['./app/assets/css/main.css']`)
    }

    // Add or merge vite config
    if (configContent.includes('vite:')) {
      // Merge with existing vite config
      configContent = configContent.replace(
        /vite:\s*\{([^}]*)\}/,
        (match, viteContent) => {
          if (viteContent.includes('plugins:')) {
            // Add to existing plugins array
            return match.replace(
              /plugins:\s*\[([^\]]*)\]/,
              (_pluginsMatch, plugins) => {
                const existingPlugins = plugins.trim()
                if (existingPlugins) {
                  return `plugins: [\n      tailwindcss(),\n      ${existingPlugins}\n    ]`
                }
                return `plugins: [\n      tailwindcss(),\n    ]`
              }
            )
          } else {
            // Add plugins to vite config
            return `vite: {\n    plugins: [\n      tailwindcss(),\n    ],${viteContent}}`
          }
        }
      )
    } else {
      // Add vite config
      configContent = addConfigProperty(configContent, `vite: {\n    plugins: [\n      tailwindcss(),\n    ],\n  }`)
    }

    // Reconstruct the config
    config = config.replace(
      /defineNuxtConfig\(\s*\{[\s\S]*?\}\s*\)/,
      `defineNuxtConfig({${configContent}})`
    )
  }

  await writeFile(nuxtConfigPath, config)
}

/**
 * Helper to add a property to the nuxt config content.
 */
function addConfigProperty(configContent: string, property: string): string {
  // Find a good insertion point - after any existing property or at the start
  const trimmed = configContent.trim()
  if (trimmed.length === 0) {
    return `\n  ${property},\n`
  }
  // Add after the first line break or at the start
  if (configContent.startsWith('\n')) {
    return `\n  ${property},${configContent}`
  }
  return `\n  ${property},\n${configContent}`
}

/**
 * Builds the formkit.config.ts file.
 * @param options - Build the formkit.config.ts file for a Nuxt project.
 * @returns
 */
function buildFormKitConfig(options: CreateAppOptions): string {
  const imports = ['import { genesisIcons } from "@formkit/icons"']
  imports.push('import { rootClasses } from "./formkit.theme"')
  if (options.lang === 'ts' && options.framework === 'vite') {
    imports.push("import { DefaultConfigOptions } from '@formkit/vue'")
  } else if (options.lang === 'ts' && options.framework === 'nuxt') {
    imports.push("import { defineFormKitConfig } from '@formkit/vue'")
  }
  const setup = []
  let config = ''
  if (options.pro) {
    imports.push("import { createProPlugin, inputs } from '@formkit/pro'")
    setup.push('')
    setup.push(`const pro = createProPlugin('${options.pro}', inputs)`)
    setup.push('')
    config += `  plugins: [pro]`
  }
  config += `${config ? ',\n' : ''}  icons: { ...genesisIcons }`
  config += `${config ? ',\n' : ''}  config: { rootClasses }`

  const viteExport = `const config${
    options.lang === 'ts' ? ': DefaultConfigOptions' : ''
  } = {
${config}
}

export default config`

  const nuxtExport = `export default defineFormKitConfig(() => ({
${config}
}))`

  let defaultExport = ''
  if (options.framework === 'nuxt') {
    defaultExport = nuxtExport
  } else if (options.framework === 'vite') {
    defaultExport = viteExport
  }

  const rawConfig = `${imports.join('\n')}
${setup.join('\n')}
${defaultExport}
`

  return rawConfig
}
