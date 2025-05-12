module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'n8n-nodes-base'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:n8n-nodes-base/recommended',
  ],
  rules: {
    // You can override or add rules here
    // For example, to enforce single quotes:
    // quotes: ['error', 'single'],
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};
