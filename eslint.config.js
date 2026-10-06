import globals from 'globals';

export default [
  {
    ignores: [
      'node_modules/**',
      'public/**',
      'docs/**',
      'resources/**',
      'swagger_output.json',
    ],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'error',
      eqeqeq: 'warn',
    },
  },
];
