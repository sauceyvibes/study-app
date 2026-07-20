import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['.next/**', 'node_modules/**', 'out/**', 'next-env.d.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
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
