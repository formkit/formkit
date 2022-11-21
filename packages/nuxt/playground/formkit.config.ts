import { fr } from '@formkit/i18n'
import type { DefaultConfigOptions } from '@formkit/vue'

const config: DefaultConfigOptions = {
  locales: { fr },
  locale: 'en',
  config: {
    rootClasses(sectionKey, node) {
      const type = node.props.type
      const classConfig = {
        outer: 'mb-5',
        legend: 'block mb-1 font-bold',
        label() {
          if (type === 'text') {
            return 'block mb-1 font-bold'
          }
          if (type === 'radio') {
            return 'text-sm text-gray-600 mt-0.5'
          }
        },
        options() {
          if (type === 'radio') {
            return 'flex flex-col flex-grow mt-2'
          }
        },
        input() {
          if (type === 'text') {
            return 'w-full h-10 px-3 mb-2 text-base text-gray-700 placeholder-gray-400 border rounded-lg focus:shadow-outline'
          }
          if (type === 'radio') {
            return 'mr-2'
          }
        },
        wrapper() {
          if (type === 'radio') {
            return 'flex flex-row flex-grow'
          }
        },
        help: 'text-xs text-gray-500',
      }

      function createClassObject(classesArray) {
        if (!classesArray) return ''
        const classList = {}
        classesArray.split(' ').forEach((className) => {
          classList[className] = true
        })
        return classList
      }

      const target = classConfig[sectionKey]
      if (typeof target === 'string') {
        return createClassObject(target)
      } else if (typeof target === 'function') {
        return createClassObject(classConfig[sectionKey]())
      }
    },
  },
}

export default config
