import { defineConfig } from 'tsdown';

export default defineConfig({
  dts: true,
  fixedExtension: false,
  target: 'es2023',
  entry: [
    './src/index.ts',
    './src/cli.ts',
    './src/core.ts',
    './src/server/index.ts',
    './src/server/source-entry.ts',
    './src/server/features.ts',
    './src/server/features/*.ts',
    './src/md-build/index.ts',
    './src/presets/fuma-docs.ts',
    './src/presets/fuma-docs-base.ts',
    './src/presets/fuma-docs-features/*.ts',
    './src/js/*',
  ],
  format: 'esm',
});
