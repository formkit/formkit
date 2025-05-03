import { createApp } from 'vue'
import { plugin, defaultConfig, createInput } from '@formkit/vue'
import { de, fr, tr } from '@formkit/i18n'
import { createMultiStepPlugin } from '../../packages/addons/src/plugins/multiStep/multiStepPlugin'
import { createRouter, createWebHashHistory } from 'vue-router'
import './assets/styles/main.scss'
import App from './vue/App.vue'
import KitchenSink from './vue/examples/KitchenSink.vue'
import BasicForm from './vue/examples/BasicForm.vue'
import AutoAnimate from './vue/examples/AutoAnimate.vue'
import ThemePlugin from './vue/examples/ThemePlugin.vue'
import ThirdPartyIcons from './vue/examples/3rdPartyIcons.vue'
import FormKitIconExample from './vue/examples/FormKitIcon.vue'
import CustomInput from './vue/examples/custom-input/CustomInput.vue'
import CurrencyInput from './vue/examples/custom-input/CurrencyInput.vue'
import FileUpload from './vue/examples/FileUpload.vue'
import GroupInput from './vue/examples/Group.vue'
import ModifySchema from './vue/examples/ModifySchema.vue'
import MultiStep from './vue/examples/MultiStep.vue'
import Playground from './vue/examples/PlaygroundWorld.vue'
import Performance from './vue/examples/PerformanceTest.vue'
import FloatingLabels from './vue/examples/FloatingLabels.vue'
import LocalStoragePlugin from './vue/examples/LocalStoragePlugin.vue'
import PasswordMeterExample from './vue/examples/PasswordMeterExample.vue'
import AutoHeightTextarea from './vue/examples/AutoHeightTextarea.vue'
import SyncedLists from './vue/examples/SyncedLists.vue'
import TestAsyncFormSubmit from './vue/examples/TestAsyncFormSubmit.vue'
import AccessibilityTest from './vue/examples/AccessibilityTest.vue'
import Zod from './vue/examples/Zod.vue'
import CustomRoot from './vue/examples/custom-elements/CustomRoot'
import CustomElements from './vue/examples/CustomElements.vue'
import '@formkit/themes/genesis'
import '@formkit/addons/css/multistep'
import { createPasswordMeterPlugin } from '@formkit/addons'

// Setup custom element
customElements.define('custom-root', CustomRoot)

const myInput = createInput(CurrencyInput)

// Create the Vue application:
const app = createApp(App)

// pro plugin
// const proPlugin = createProPlugin(
//   '/* put dev key here — do NOT commit and push it */',
//   inputs
// )

// Configure FormKit:
const config = defaultConfig({
  locales: { de, fr, tr },
  locale: 'en',
  theme: 'genesis',
  icons: {
    formkit: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M4 0.0182495H0V4.01533H4V8.01167L7.9989 8.01167V12.0088H4V16.0058H0V20.0029H4V16.0058H8V12.0088H11.9989V8.01167L8 8.01167V4.01459H4V0.0182495ZM11.9983 20.0029H15.9977H15.9983H19.9972H19.9977H23.9972V24H19.9977H19.9972H15.9983H15.9977H11.9983V20.0029Z" fill="currentColor"/></svg>`,
  },
  inputs: { foo: myInput },
  plugins: [
    // proPlugin,
    // createAutoAnimatePlugin(),
    createMultiStepPlugin(),
    createPasswordMeterPlugin(),
  ],
})

// Install FormKit:
app.use(plugin, config)

// Create a new router (to navigate the examples)
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/kitchen-sink',
      component: KitchenSink,
    },
    {
      path: '/',
      component: BasicForm,
    },
    {
      path: '/custom-elements',
      component: CustomElements,
    },
    {
      path: '/auto-animate',
      component: AutoAnimate,
    },
    {
      path: '/basic-form',
      component: BasicForm,
    },
    {
      path: '/async-form-test',
      component: TestAsyncFormSubmit,
    },
    {
      path: '/theme-plugin',
      component: ThemePlugin,
    },
    {
      path: '/custom-icons',
      component: ThirdPartyIcons,
    },
    {
      path: '/formkit-icon-component',
      component: FormKitIconExample,
    },
    {
      path: '/custom-input',
      component: CustomInput,
    },
    {
      path: '/file-upload',
      component: FileUpload,
    },
    {
      path: '/group',
      component: GroupInput,
    },
    {
      path: '/plugin-schema',
      component: ModifySchema,
    },
    {
      path: '/multi-step',
      component: MultiStep,
    },
    {
      path: '/floating-labels',
      component: FloatingLabels,
    },
    {
      path: '/local-storage',
      component: LocalStoragePlugin,
    },
    {
      path: '/password-meter',
      component: PasswordMeterExample,
    },
    {
      path: '/auto-height-textarea',
      component: AutoHeightTextarea,
    },
    {
      path: '/playground',
      component: Playground,
    },
    {
      path: '/performance',
      component: Performance,
    },
    {
      path: '/synced-lists',
      component: SyncedLists,
    },
    {
      path: '/e2e',
      children: [
        {
          path: 'memory-control',
          component: () => import('./vue/e2e/MemoryTestControl.vue'),
        },
        {
          path: 'memory',
          component: () => import('./vue/e2e/MemoryTest.vue'),
        },
        {
          path: 'memory-unmount',
          component: () => import('./vue/e2e/MemoryTestUnmount.vue'),
          children: [
            {
              path: 'schema',
              component: () => import('./vue/e2e/MemoryTestUnmountSchema.vue'),
            },
            {
              path: 'blank',
              component: () => import('./vue/e2e/MemoryTestUnmountBlank.vue'),
            },
            {
              path: 'control',
              component: () => import('./vue/e2e/MemoryTestUnmountControl.vue'),
            },
          ],
        },
      ],
    },
    {
      path: '/zod',
      component: Zod,
    },
    {
      path: '/accessibility-test',
      component: AccessibilityTest,
    },
  ],
})

// Install the router
app.use(router)

// Mount the Vue application
app.mount('#vue-app')
