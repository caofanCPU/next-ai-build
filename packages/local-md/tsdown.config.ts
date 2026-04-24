import { defineConfig } from 'tsdown';

export default defineConfig({
  dts: true,
  fixedExtension: false,
  target: 'es2023',
  entry: ['./src/index.ts', './src/server/index.ts', './src/server/features.ts', './src/presets/fuma-docs.ts', './src/js/*'],
  format: 'esm',
});
