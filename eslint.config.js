import pluginVue from 'eslint-plugin-vue'
import {
  defineConfigWithVueTs,
  vueTsConfigs,
} from '@vue/eslint-config-typescript'
import pluginTsdoc from 'eslint-plugin-tsdoc'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

export default defineConfigWithVueTs(
  // Global ignores
  {
    ignores: ['**/dist/**', '**/dist.*', '**/node_modules/**', '**/.nuxt/**'],
  },

  // Vue + TypeScript base configuration
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,

  // TypeScript files configuration
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mts'],
    plugins: {
      tsdoc: pluginTsdoc,
    },
    rules: {
      '@typescript-eslint/no-extra-semi': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/ban-types': 'off',
      'tsdoc/syntax': 'warn',
    },
  },

  // JavaScript/MJS files configuration
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2020,
      },
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['error', { varsIgnorePattern: '^_' }],
    },
  },

  // Test files configuration
  {
    files: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },

  // Vue files configuration
  {
    files: ['**/*.vue'],
    languageOptions: {
      globals: {
        defineProps: 'readonly',
        defineEmits: 'readonly',
        defineExpose: 'readonly',
        withDefaults: 'readonly',
      },
    },
  },

  // Prettier must be last to override other formatting rules
  prettier
)
