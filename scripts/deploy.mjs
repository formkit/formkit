import glob from 'glob'
import { mkdtemp, copyFile } from 'fs/promises'
import { existsSync } from 'fs'
import cac from 'cac'
import os from 'os'
import path from 'path'
import execa from 'execa'
import { mkdir } from 'fs'
import prompts from 'prompts'

async function askForVersion() {
  const { version } = await prompts({
    type: 'text',
    name: 'version',
    message: `What version are you deploying (1.0.0-alpha.x)?`,
  })
  return version
}

async function deploy(version) {
  if (!version) {
    version = await askForVersion()
  }
  const dir = await mkdtemp(path.join(os.tmpdir(), 'formkit-'))
  glob('packages/*/dist/formkit-*.js', (err, matches) => {
    matches.forEach((file) => {
      const dest = `${dir}/${path.parse(file).name}.js`
      copyFile(file, dest)
    })
  })
  glob('packages/themes/dist/*/*.css', (err, matches) => {
    matches.forEach((file) => {
      const theme = path.parse(file).dir.split('/').pop()
      const alreadyExists = existsSync(`${dir}/${theme}`)
      if (!alreadyExists) {
        mkdir(`${dir}/${theme}`, { recursive: true }, (err) => {
          if (err) {
            console.error(err)
          }
        })
      }
      const dest = `${dir}/${theme}/${path.parse(file).name}.css`
      copyFile(file, dest)
    })
  })
  const output = await execa('rsync', [
    '-avz',
    dir + '/',
    '-e ssh',
    `root@159.203.159.68:/var/www/vhosts/assets.wearebraid.com/formkit/unpkg${
      version ? '/' + version : ''
    }`,
    '--chmod=Do+rwx',
  ])
  if (output.exitCode) {
    console.error(output)
  } else {
    console.log('Successfully deployed')
  }
}

export default function () {
  const cli = cac()
  cli
    .command('[version]', 'Deploys as a specific package version', {
      allowUnknownOptions: true,
    })
    .action(deploy)
  cli.help()
  cli.parse()
}
