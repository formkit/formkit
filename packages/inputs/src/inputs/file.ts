import { FormKitTypeDefinition } from '@formkit/core'
import {
  outer,
  inner,
  wrapper,
  label,
  help,
  messages,
  message,
  prefix,
  suffix,
  icon,
  fileInput,
  fileItem,
  fileList,
  fileName,
  fileRemove,
  noFiles,
  files,
  $if,
  defaultIcon,
} from '../compose'

/**
 * Input definition for a file input.
 * @public
 */
export const file: FormKitTypeDefinition = {
  /**
   * The actual schema of the input, or a function that returns the schema.
   */
  schema: outer(
    wrapper(
      label('$label'),
      inner(
        icon('prefix', 'label'),
        prefix(),
        fileInput(),
        fileList(
          fileItem(
            icon('fileItem'),
            fileName('$file.name'),
            $if(
              '$value.length === 1',
              fileRemove(icon('fileRemove'), '$ui.remove.value')
            )
          )
        ),
        $if('$value.length > 1', fileRemove('$ui.removeAll.value')),
        noFiles(icon('fileItem'), '$ui.noFiles.value'),
        suffix(),
        icon('suffix')
      )
    ),
    help('$help'),
    messages(message('$message.value'))
  ),
  /**
   * The type of node, can be a list, group, or input.
   */
  type: 'input',
  /**
   * An array of extra props to accept for this input.
   */
  props: [],
  /**
   * Additional features that should be added to your input
   */
  features: [
    files,
    defaultIcon('fileItem', 'fileDoc'),
    defaultIcon('fileRemove', 'close'),
  ],
}
