import {
  TranslateClient,
  TranslateTextCommand,
} from '@aws-sdk/client-translate'
import prompts from 'prompts'
import { msg, getLocales } from './utils.mjs'
import clipboardy from 'clipboardy'
import { execSync } from 'child_process'

const unsuportedLanguages = ['fy', 'tg', 'nb', 'tet']

async function translate() {
  const { Text } = await prompts({
    type: 'text',
    name: 'Text',
    message: `Enter a string to translate:`,
  })
  const { Key } = await prompts({
    type: 'text',
    name: 'Key',
    message: `What is the message key (optional message key):`,
  })
  const { Comment } = Key
    ? await prompts({
        type: 'text',
        name: 'Comment',
        message: `When is this string shown (optional comment):`,
      })
    : { Comment: '' }
  msg.loader.start('Requesting translations')
  const locales = await getLocales()
  const client = new TranslateClient({
    region: 'us-east-1',
  })
  const commands = []
  for (let locale of locales) {
    if (unsuportedLanguages.includes(locale)) continue
    commands.push(
      new TranslateTextCommand({
        SourceLanguageCode: 'en',
        TargetLanguageCode: locale,
        Text,
      })
    )
  }
  const results = await Promise.all(
    commands.map((command) => client.send(command))
  )
  msg.loader.stop()
  selectResults(results, Key, Comment)
  msg.success('Translation complete.')
}

/**
 *
 */
async function selectResults(results, key, comment) {
  const choices = results.reduce((messages, msg) => {
    messages.push({
      title: `${msg.TargetLanguageCode}: ${msg.TranslatedText}`,
      value: msg.TargetLanguageCode,
    })
    return messages
  }, [])

  const translations = results.reduce((messages, msg) => {
    messages[msg.TargetLanguageCode] = msg.TranslatedText
    return messages
  }, {})

  const { locale } = await prompts.prompt({
    type: 'select',
    name: 'locale',
    message: 'Select a translation to copy',
    choices,
  })
  if (!locale) return
  let clipboard = key
    ? `${key}: '${translations[locale]}'`
    : translations[locale]
  if (comment) {
    clipboard = `  /**
   * ${comment}
   */
 ${clipboard},`
  }
  clipboardy.writeSync(clipboard)
  msg.info('Copied to clipboard ✔')
  execSync(`code packages/i18n/src/locales/${locale}.ts`)
  await new Promise((r) => setTimeout(r, 200))
  const remaining = results.filter(
    (result) => result.TargetLanguageCode !== locale
  )
  if (remaining.length) {
    selectResults(remaining, key, comment)
  }
}

// const client = new TranslateClient({ region: "us-east-1" });
// const command = new CreateParallelDataCommand(params);

/**
 * Adds the stub command.
 * @param {typeof import('cac').default} cli
 */
export default function (cli) {
  cli
    .command(
      'translate',
      'Translate a given string into all existing locales',
      {
        allowUnknownOptions: true,
      }
    )
    .action(() => translate())
}
