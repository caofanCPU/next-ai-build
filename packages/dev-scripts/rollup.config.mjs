import { defineConfig } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

// Define export point
const entries = [
  'src/cli.ts',
  'src/index.ts'
];

const baseConfig = {
  external: [
    'commander',
    'fast-glob',
    'picocolors',
    'fs-extra',
    'fs',
    'path',
    'child_process',
    'module',
    'url',
    'typescript',
    /^node:/
  ],
  plugins: [
    resolve({
      preferBuiltins: true,
      extensions: ['.ts', '.js']
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: 'dist',
      rootDir: 'src',
      exclude: ['**/*.test.ts'],
      module: 'esnext',
      sourceMap: false
    })
  ]
};

const onwarn = (warning, warn) => {
  // ignore warnings
  if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
    return;
  }
  warn(warning);
};

export default defineConfig([
  // ESM build
  {
    ...baseConfig,
    onwarn,
    input: entries,
    output: {
      dir: 'dist',
      format: 'es',
      preserveModules: true,
      preserveModulesRoot: 'src',
      entryFileNames: '[name].mjs',
      chunkFileNames: '[name]-[hash].mjs'
    }
  },
  // CJS build
  {
    ...baseConfig,
    onwarn,
    input: entries,
    output: {
      dir: 'dist',
      format: 'cjs',
      preserveModules: true,
      preserveModulesRoot: 'src',
      entryFileNames: '[name].js',
      chunkFileNames: '[name]-[hash].js',
      exports: 'named'
    }
  }
]);
