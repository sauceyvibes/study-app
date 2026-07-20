import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';

export default tseslint.config(
  { ignores: ['.next/**', 'node_modules/**', 'out/**', 'next-env.d.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Next's own rules, wired up for flat config. Registered without a `files`
    // scope on purpose: `next build` inspects the top-level plugin registration
    // to decide whether the plugin is present, and a scoped block reads to it as
    // absent. Beyond silencing that warning, these rules catch the App Router
    // mistakes TypeScript cannot — a raw <img>, a synchronous script tag.
    plugins: { '@next/next': nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
  {
    rules: {
      // The corpus files are long literals; unused vars there are a real signal,
      // but leading-underscore parameters are a deliberate convention.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // GeoJSON namespace types come from @types/geojson as globals.
      'no-undef': 'off',
    },
  },
);
