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
} from '../sections'
import files from '../features/files'
import { $if } from '../compose'

/**
 * Input definition for a file input.
 * @public
 */
export const file: FormKitTypeDefinition = {
  /**
   * The actual schema of the input, or a function that returns the schema.
   */
  // prettier-ignore
  schema: outer(
    wrapper(
      label('$label'),
      inner(
        icon('prefix'),
        prefix(),
        fileInput(),
        fileList(
          fileItem(
            fileName('$file.name'),
            $if('$value.length === 1', fileRemove('$ui.remove.value')),
          )
        ),
        $if('$value.length > 1', fileRemove('$ui.removeAll.value')),
        noFiles('$ui.noFiles.value'),
        suffix(),
        icon('suffix')
      )
    ),
    help('$help'),
    messages(
      message('$message.value')
    )
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
  features: [files],
}
