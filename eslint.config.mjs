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
  {
    // Code relying on Nuxt auto-imports: a local `ref`/`computed`/… hides the auto-import
    // for the whole file (runtime "ref is not defined").
    files: ['app/**/*.vue', 'app/stores/**', 'app/composables/**', 'app/utils/**', 'app/middleware/**', 'app/plugins/**', 'app/services/**'],
    rules: {
      'id-denylist': ['error', 'ref', 'computed', 'reactive', 'watch'],
    },
  },
)
