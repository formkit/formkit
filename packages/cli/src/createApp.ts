import { execa } from 'execa'
import { readFile, writeFile, readdir } from 'fs/promises'
import { resolve } from 'path'
import { cwd } from 'node:process'
import prompts from 'prompts'
import { error, green, __dirname } from './index'

interface CreateAppOptions {
  lang: 'ts' | 'js'
  framework: 'nuxt' | 'vite'
  pro?: string
}

export async function createApp(
  appName?: string,
  options: Partial<CreateAppOptions> = {}
): Promise<void> {
  if (!appName) {
    const res = await prompts({
      type: 'text',
      name: 'name',
      message: 'Please enter a name for the project:',
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
      {
        type: (prev) => (prev ? 'text' : null),
        name: 'pro',
        message: 'Enter a project key from https://pro.formkit.com:',
      },
    ])
    options.pro = res.pro as string
  }

  if (options.framework === 'vite') {
    await execa('npx', [
      '--yes',
      'create-vite',
      appName,
      '--template',
      `vue${options.lang === 'ts' ? '-ts' : ''}`,
    ])
    // TODO: add better version matching here:
    await addDependency(appName, '@formkit/vue', 'next')
    await addDependency(appName, '@formkit/icons', 'next')
    if (options.pro) {
      await addDependency(appName, '@formkit/pro')
    }
    await addInitialApp(appName, 'src/App.vue', !!options.pro)
    await writeFile(
      resolve(cwd(), `./${appName}/src/formkit.config.${options.lang}`),
      buildFormKitConfig(options as CreateAppOptions)
    )
    await writeFile(
      resolve(cwd(), `./${appName}/src/main.${options.lang}`),
      buildMain()
    )
  } else {
    options.lang = 'ts'
    await execa('npx', ['--yes', 'nuxi', 'create', appName])
    await writeFile(
      resolve(cwd(), `./${appName}/formkit.config.ts`),
      buildFormKitConfig(options as CreateAppOptions)
    )
    await addDependency(appName, '@formkit/nuxt', 'latest')
    await addDependency(appName, '@formkit/icons', 'latest')
    if (options.pro) {
      await addDependency(appName, '@formkit/pro')
    }
    await addNuxtModule(appName)
    await addInitialApp(appName, 'app.vue', !!options.pro)
  }

  green(`Created ${appName}!

To run your new app:
📁 cd ${appName}
✅ npm install
🚀 npm run dev
`)
}

async function addInitialApp(dirName: string, component: string, pro: boolean) {
  const appPath = resolve(cwd(), `./${dirName}/${component}`)
  await writeFile(
    appPath,
    `<script setup>
async function submit() {
  await new Promise(r => setTimeout(r, 1000))
  alert('Submitted! 🎉')
}
</script>

<template>
  <div class="your-first-form">
    <img
      src="https://pro.formkit.com/logo.svg"
      alt="FormKit Logo"
      width="244"
      height="50"
      class="logo"
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
      <pre>{{ value }}</pre>
    </FormKit>
  </div>
</template>

<style scoped>
.your-first-form {
  width: calc(100% - 2em);
  max-width: 480px;
  box-sizing: border-box;
  padding: 2em;
  box-shadow: 0 0 1em rgba(0, 0, 0, .1);
  border-radius: .5em;
  margin: 4em auto;
}

.logo {
  width: 150px;
  height: auto;
  display: block;
  margin: 0 auto 2em auto;
}
pre {
  background-color: rgba(0, 100, 250, .1);
  padding: 1em;
}
</style>
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
  const packageJsonPath = resolve(cwd(), `./${dirName}/package.json`)
  const raw = await readFile(packageJsonPath, 'utf-8')
  const packageJson = JSON.parse(raw)
  if (!('dependencies' in packageJson)) {
    packageJson.dependencies = {}
  }
  packageJson.dependencies[dependency] = version
  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
}

function buildMain() {
  return `import { createApp } from 'vue'
import { plugin, defaultConfig } from '@formkit/vue'
import App from './App.vue'
import formKitConfig from './formkit.config'

const app = createApp(App)
app.use(plugin, defaultConfig(formKitConfig))
app.mount('#app')
`
}

async function addNuxtModule(dirName: string) {
  const nuxtConfigPath = resolve(cwd(), `./${dirName}/nuxt.config.ts`)
  const raw = await readFile(nuxtConfigPath, 'utf-8')
  const configWithFormKit = raw.replace(
    /(defineNuxtConfig\({\n).*?(\n}\))/g,
    "$1  modules: ['@formkit/nuxt']$2"
  )
  await writeFile(nuxtConfigPath, configWithFormKit)
}

/**
 * Builds the formkit.config.ts file.
 * @param options - Build the formkit.config.ts file for a Nuxt project.
 * @returns
 */
function buildFormKitConfig(options: CreateAppOptions): string {
  const imports = [
    'import "@formkit/themes/genesis"',
    'import { genesisIcons } from "@formkit/icons"',
  ]
  if (options.lang === 'ts') {
    imports.push("import { DefaultConfigOptions } from '@formkit/vue'")
  }
  const setup = []
  let config = ''
  if (options.pro) {
    imports.push("import { createProPlugin, inputs } from '@formkit/pro'")
    imports.push("import '@formkit/pro/genesis'")
    setup.push('')
    setup.push(`const pro = createProPlugin('${options.pro}', inputs)`)
    setup.push('')
    config += `  plugins: [pro]`
  }
  config += `${
    config ? ',\n' : ''
  }  icons: { ...genesisIcons }`

  const rawConfig = `${imports.join('\n')}
${setup.join('\n')}
const config${options.lang === 'ts' ? ': DefaultConfigOptions' : ''} = {
${config}
}

export default config
`
  return rawConfig
}

async function isDirEmpty(path: string) {
  try {
    const entries = await readdir(path)
    return entries.length === 0
  } catch (error) {
    return true
  }
}
