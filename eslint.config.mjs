// @ts-check
import storybook from 'eslint-plugin-storybook'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    ignores: ['storybook-static/**', '*.drawio', 'public/**'],
  },
  ...storybook.configs['flat/recommended'],
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
)
