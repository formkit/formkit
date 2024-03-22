import { createInput, defineFormKitConfig } from '@formkit/vue'
import { createMultiStepPlugin } from '@formkit/addons'
import { genesisIcons } from '@formkit/icons'
import '@formkit/addons/css/multistep.css'
import { generateClasses } from '@formkit/themes'
import { rootClasses } from './formkit.theme'

export default defineFormKitConfig(() => {
  return {
    plugins: [createMultiStepPlugin()],
    icons: { ...genesisIcons },
    inputs: {
      foo: createInput({ $el: 'h1', children: 'FOOBAR!' }),
    },
    config: {
      rootClasses,
      classes: generateClasses({
        global: {
          outer: ['fizz', 'bizz', 'fuzz', 'buzz'],
          wrapper: 'foo boo faz baz',
        },
      }),
    },
  }
})
