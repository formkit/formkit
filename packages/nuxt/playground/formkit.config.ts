import { FormKitNode } from '@formkit/core'
import { fr } from '@formkit/i18n'
import { DefaultConfigOptions } from '@formkit/vue'

function getClassConfig(type: string) {
  return {
    outer: 'mb-5',
    legend: 'block mb-1 font-bold',
    label() {
      if (type === 'text') {
        return 'block mb-1 font-bold'
      }
      if (type === 'radio') {
        return 'text-sm text-gray-600 mt-0.5'
      }
      return ''
    },
    options() {
      if (type === 'radio') {
        return 'flex flex-col flex-grow mt-2'
      }
      return ''
    },
    input() {
      if (type === 'text') {
        return 'w-full h-10 px-3 mb-2 text-base text-gray-700 placeholder-gray-400 border rounded-lg focus:shadow-outline'
      }
      if (type === 'radio') {
        return 'mr-2'
      }
      return ''
    },
    wrapper() {
      if (type === 'radio') {
        return 'flex flex-row flex-grow'
      }
      return ''
    },
    help: 'text-xs text-gray-500',
  }
}

const config: DefaultConfigOptions = {
  locales: { fr },
  locale: 'en',
  config: {
    rootClasses(sectionKey: string, node: FormKitNode) {
      const classConfig = getClassConfig(node.props.type)

      function createClassObject(classesArray?: string) {
        if (!classesArray) return {}
        const classList: Record<string, boolean> = {}
        classesArray.split(' ').forEach((className) => {
          classList[className] = true
        })
        return classList
      }

      const target = classConfig[sectionKey as keyof typeof classConfig]
      if (typeof target === 'string') {
        return createClassObject(target)
      } else if (typeof target === 'function') {
        return createClassObject(target())
      }
      return {}
    },
  },
}

export default config
