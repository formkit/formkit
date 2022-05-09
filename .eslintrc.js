module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint/eslint-plugin',
    'eslint-plugin-tsdoc',
    'eslint-plugin-html',
  ],
  extends: ['plugin:@typescript-eslint/recommended'],
  parserOptions: {
    sourceType: 'module',
  },
  rules: {
    '@typescript-eslint/no-extra-semi': 0,
    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^_' }],
    'tsdoc/syntax': 'warn',
  },
  ignorePatterns: ['dist.*'],
  overrides: [
    {
      files: '*.mjs',
      parser: 'espree',
      env: {
        node: true,
        es6: true,
      },
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      plugins: [],
      extends: 'eslint:recommended',
      rules: {
        'tsdoc/syntax': 0,
      },
    },
    {
      files: '**/__tests__/**.ts',
      rules: {
        '@typescript-eslint/no-empty-function': 0,
        '@typescript-eslint/no-non-null-assertion': 0,
      },
    },
    {
      files: '*.vue',
      extends: [
        'plugin:vue/vue3-recommended',
        'eslint:recommended',
        '@vue/typescript/recommended',
      ],
      globals: {
        defineProps: 'readonly',
        defineEmits: 'readonly',
        defineExpose: 'readonly',
        withDefaults: 'readonly',
      },
    },
  ],
}
