// ESLint flat config for Nairi (Next.js 16 + TypeScript 5).
//
// Notes:
// - `next lint` was removed in Next.js 16; this config is consumed directly by
//   the `eslint` CLI (see `lint` / `lint:fix` scripts in package.json).
// - eslint-config-next v16 ships flat configs natively, so no FlatCompat shim
//   is needed. `nextVitals` provides the Next.js + React + React Hooks + JSX
//   a11y rules (core-web-vitals severity), `nextTypescript` adds the
//   typescript-eslint recommended rules (including no-unused-vars detection).
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  // Next.js recommended rules: @next/*, react, react-hooks, jsx-a11y, import
  ...nextVitals,

  // TypeScript-aware rules from typescript-eslint (parser + plugin registration)
  ...nextTypescript,

  {
    // Unused variables are dead code and almost always a bug: escalate the
    // typescript-eslint default (warn) to a blocking error. Prefixing a
    // variable/argument/caught error with `_` opts it out intentionally.
    name: 'nairi/typescript-rules',
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },

  {
    // Consistent import ordering: builtins -> external -> internal (@/ aliases)
    // -> parent -> sibling -> index, with blank lines between groups and
    // alphabetical sorting within a group. Auto-fixable via `npm run lint:fix`.
    name: 'nairi/import-rules',
    files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'],
    rules: {
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          pathGroups: [
            {
              pattern: '@/**',
              group: 'internal',
              position: 'before',
            },
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },

  // Project-specific ignores on top of eslint-config-next's defaults
  // (.next/**, out/**, build/**, next-env.d.ts).
  globalIgnores([
    'node_modules/**',
    '.git/**',
    'playwright-report/**',
    'test-results/**',
    'coverage/**',
    'audit_runs/**',
    'opencode-wasm/**',
    'public/**',
    'nairi_v34_res/**',
    'supabase/migrations/**',
  ]),
])

export default eslintConfig
