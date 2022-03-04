import { FormKitExtendableSchemaRoot } from '@formkit/core'
import label from '../composables/label'
import outer from '../composables/outer'
import wrapper from '../composables/wrapper'
import inner from '../composables/inner'
import file from '../composables/file'
import help from '../composables/help'
import prefix from '../composables/prefix'
import suffix from '../composables/suffix'
import messages from '../composables/messages'
import message from '../composables/message'
import fileList from '../composables/fileList'
import fileItem from '../composables/fileItem'
import fileName from '../composables/fileName'
import noFiles from '../composables/noFiles'
import removeFiles from '../composables/removeFiles'

/**
 * The schema for text classifications.
 * @public
 */
const fileSchema: FormKitExtendableSchemaRoot = (extensions = {}) => [
  outer(extensions.outer, [
    wrapper(extensions.wrapper, [
      label(extensions.label, '$label'),
      inner(extensions.inner, [
        prefix(extensions.prefix),
        file(extensions.input),
        fileList(extensions.fileList, [
          fileItem(extensions.file, [
            fileName(extensions.fileName, '$file.name'),
            {
              if: '$value.length == 1',
              then: removeFiles(extensions.removeFiles, '$ui.remove.value'),
            },
          ]),
        ]),
        {
          if: '$value.length > 1',
          then: removeFiles(extensions.removeFiles, '$ui.removeAll.value'),
        },
        noFiles(extensions.noFiles, '$ui.noFiles.value'),
        suffix(extensions.suffix),
      ]),
    ]),
    help(extensions.help, '$help'),
    messages(extensions.messages, [
      message(extensions.message, '$message.value'),
    ]),
  ]),
]

export default fileSchema
