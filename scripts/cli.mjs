import cac from 'cac'
import prompts from 'prompts'

import build from './build.mjs'
import publish from './publish.mjs'
import deploy from './deploy.mjs'

async function runCLI(s) {
  let script = s[0]
  switch (script) {
    case 'build':
      script = build
      break
    case 'publish':
      script = publish
      break
    case 'deploy':
      script = deploy
      break
    default:
      script = ''
      break
  }
  if (!script) {
    const { selectedScript } = await prompts({
      type: 'select',
      name: 'selectedScript',
      message: 'Choose a script:',
      choices: [
        {
          title: 'Build',
          value: build,
        },
        {
          title: 'Publish',
          value: publish,
        },
        {
          title: 'Deploy',
          value: deploy,
        },
      ],
    })
    script = selectedScript
  }
  script()
}

/**
 * Set up the command line tool and options.
 */
const cli = cac()
cli.option('--script [script]', 'Name of the script you would like to run', {
  default: false,
  type: [String],
})
cli
  .command('[cli]', 'Generic entrypoint for FormKit Monorepo CLI tooling', {
    allowUnknownOptions: true,
  })
  .action((dir, options) => {
    runCLI(options.script)
  })
cli.help()
cli.parse()
