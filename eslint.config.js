// eslint.config.js
import js from '@eslint/js';
import tsplugin from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  // Config JS recommandée
  js.configs.recommended,

  // Config TypeScript
  {
    files: ['**/*.ts', '**/*.js'],
    ignores: ['.github/**/*.js'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: ['./tsconfig.app.json', './tsconfig.spec.json'],
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        ng: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsplugin,
    },
    rules: {
      ...tsplugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },

  // Config pour les scripts Node.js dans .github
  {
    files: ['.github/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        process: 'readonly',
        console: 'readonly',
        global: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        globalThis: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      'no-undef': 'off',
    },
  },

  // Config pour fichiers de test
  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jasmine: 'readonly',
        spyOn: 'readonly',
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },

  // Fichiers à ignorer
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '*.config.js',
      '*.config.ts',
      'coverage/**',
      'e2e/**',
    ],
  },
];
