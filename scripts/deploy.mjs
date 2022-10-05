import glob from 'glob'
import { mkdtemp, copyFile, readFile } from 'fs/promises'
import { existsSync, lstatSync, readFileSync } from 'fs'
import cac from 'cac'
import os from 'os'
import path from 'path'
import { execa } from 'execa'
import { mkdir } from 'fs'
import prompts from 'prompts'
import { getPackages, msg } from './utils.mjs'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import {
  CloudFrontClient,
  CreateInvalidationCommand,
  GetInvalidationCommand,
} from '@aws-sdk/client-cloudfront'
import { minify } from 'terser'

/**
 * Setup a few basic AWS sdk details:
 */
const awsConfig = {
  region: 'us-east-1',
}
const s3 = new S3Client(awsConfig)
const cloudfront = new CloudFrontClient(awsConfig)
const distributionId = 'E1VORKQ727K1W8'

// The current version of Vue
const vueVersion = JSON.parse(
  readFileSync('./node_modules/vue/package.json')
).version

async function askForVersion() {
  const { version } = await prompts({
    type: 'text',
    name: 'version',
    message: `What version are you deploying (1.0.0-alpha.x)?`,
  })
  return version
}

async function deploy(version, options) {
  if (!version) {
    version = await askForVersion()
  }
  if (!vueVersion) {
    msg.error('Unable to determine VueJS version.')
    process.exit()
  } else {
    if (options.iife) {
      await deployIIFE(version)
    } else {
      msg.info(`Bundling with vue@${vueVersion}`)
      msg.info(`» deploying ${version}`)
      await deployESM(version)
    }
  }
}

/**
 * Deploy full packages to the FormKit Cloudfront CDN.
 * @param {string} version
 */
async function deployESM(version) {
  let uploaded = 0
  let failed = 0
  const uploads = []
  msg.loader.start('» uploading files')
  getPackages().forEach((pkg) => {
    const matches = glob.sync(`packages/${pkg}/dist/**/*`)
    matches.forEach((file) => {
      if (
        !lstatSync(file).isDirectory() &&
        (file.endsWith('index.mjs') || file.endsWith('.css'))
      ) {
        uploads.push(sendFile(version, pkg, file))
      }
    })
  })
  const results = await Promise.all(uploads)
  results.forEach((result) => (result ? uploaded++ : failed++))
  if (failed) {
    msg.error('Not all files were deployed. ' + failed + ' did not upload.')
  } else {
    msg.loader.succeed(
      'Deployment successful. Uploaded ' + uploaded + ' files.'
    )
    msg.loader.start('» Refreshing CDN assets')
    const {
      Invalidation: { Id },
    } = await cloudfront.send(
      new CreateInvalidationCommand({
        DistributionId: distributionId,
        InvalidationBatch: {
          CallerReference: String(new Date().getTime()),
          Paths: {
            Quantity: results.length,
            Items: results.map((file) => '/' + file),
          },
        },
      })
    )
    await waitForInvalidations(Id)
    msg.loader.succeed('CDN Updated Successfully')
  }
}

async function waitForInvalidations(Id) {
  await new Promise((r) => setTimeout(r, 3000))
  const {
    Invalidation: { Status },
  } = await cloudfront.send(
    new GetInvalidationCommand({
      DistributionId: distributionId,
      Id,
    })
  )
  if (Status === 'Completed') {
    return true
  }
  msg.loader.start(
    `Invalidating stale assets... (${
      Status === 'InProgress' ? 'in progress' : Status
    })`
  )
  return await waitForInvalidations(Id)
}

/**
 * Upload an individual file to s3.
 * @param {string} version - The version being uploaded.
 * @param {string} pkg - The name of the package.
 * @param {string} file - The specific file being uploaded.
 */
async function sendFile(version, pkg, file) {
  try {
    const Body = await prepForDistribution(
      await readFile(file, { encoding: 'utf8' }),
      version,
      !file.endsWith('.css') // dont minify css
    )
    let mime = 'application/javascript'
    let Key = `${pkg}@${version}`
    if (file.endsWith('.ts')) {
      mime = 'application/x-typescript'
    } else if (file.endsWith('.css')) {
      Key = `themes@${version}-${
        file.substring(`packages/${pkg}/dist/`.length).split('/')[0]
      }.css`
      mime = 'text/css'
    }
    const params = {
      Bucket: 'cdn.formk.it',
      Key,
      Body,
      ContentType: mime,
    }
    try {
      await s3.send(new PutObjectCommand(params))
      return Key
    } catch (err) {
      console.error(err)
      return false
    }
  } catch (err) {
    console.error('Unable to read file', file)
    throw new Error(err)
  }
}

/**
 * Prepare the file for ESM distribution.
 * @param {string} file - The file source code to replace
 * @param {string} version - The version we are publishing
 * @returns
 */
async function prepForDistribution(file, version, min = true) {
  let src = file.replace(
    /(from|import)\s+['"]@formkit\/([a-z0-9]+)['"]/g,
    `$1 '/$2@${version}'`
  )
  // const vueImportRegex = /^import\s+(.*)\s+from\s+'vue';?/gm
  // const vueMatch = src.match(vueImportRegex)
  // if (vueMatch) {
  //   src = src.replace(vueImportRegex, '')
  //   const vueImportStatement = `const $1 = await import(\`./vue.js?src=\${(new URL(import.meta.url).searchParams.get('vue') || 'https://cdn.jsdelivr.net/npm/vue@next/%2Besm')}\`);`
  //   src = src.replace(
  //     /(^import\s+.*;)(?!\s(import|export))/gm,
  //     '$1\n' + vueMatch[0]
  //   )
  //   src = src.replace(vueImportRegex, vueImportStatement)
  // }
  if (!min) return src

  try {
    const result = await minify(src, { module: true })
    return result.code
  } catch (err) {
    console.error(err)
    throw err
  }
}

/**
 * Deploy the project to a file store used for iife distribution. This is a
 * feature deprecated by the cdn.formk.it content delivery network.
 * @param {string} version
 */
async function deployIIFE(version) {
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
    .option('-i, --iife', 'Deploy iife to legacy stack instead of esm')
    .action(deploy)
  cli.help()
  cli.parse()
}
