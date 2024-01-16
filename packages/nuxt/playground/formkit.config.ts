import { createInput, defineFormKitConfig } from '@formkit/vue'
import { createMultiStepPlugin } from '@formkit/addons'
import { genesisIcons } from '@formkit/icons'
import '@formkit/themes/genesis'
import '@formkit/addons/css/multistep.css'

export default defineFormKitConfig(() => {
  return {
    plugins: [createMultiStepPlugin()],
    icons: { ...genesisIcons },
    inputs: {
      foo: createInput({ $el: 'h1', children: 'FOOBAR!' }),
    },
  }
})
