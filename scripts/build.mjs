import fs from 'fs'
import chalk from 'chalk'

const log = console.log
const info = m => log(chalk.keyword('orange')(m))
const error = m => log(chalk.bold.red(m))
info('Building FormKit')
error('nothign to build')

