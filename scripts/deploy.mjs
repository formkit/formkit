import glob from 'glob'
import { mkdtemp, copyFile } from 'fs/promises'
import os from 'os'
import path from 'path'
import execa from 'execa'
;(async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'formkit-'))
  glob('packages/*/dist/formkit-*.js', (err, matches) => {
    matches.forEach((file) => {
      const dest = `${dir}/${path.parse(file).name}.js`
      copyFile(file, dest)
    })
  })
  const output = await execa('rsync', [
    '-avz',
    dir + '/',
    '-e ssh',
    'root@159.203.159.68:/var/www/vhosts/assets.wearebraid.com/formkit/unpkg',
    '--chmod=Do+rwx',
  ])
  if (output.exitCode) {
    console.error(output)
  } else {
    console.log('Successfully deployed')
  }
})()
