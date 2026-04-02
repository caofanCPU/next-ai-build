import { defineConfig } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import packageJson from './package.json' with { type: 'json' };

// Define export point
const entries = [
  'src/cli.ts',
  'src/index.ts'
];

const externalPackages = [
  ...Object.keys(packageJson.dependencies ?? {}),
  ...Object.keys(packageJson.peerDependencies ?? {})
];

const isExternal = (id) => {
  if (
    id === 'fs' ||
    id === 'path' ||
    id === 'child_process' ||
    id === 'module' ||
    id === 'url' ||
    id === 'os' ||
    /^node:/.test(id)
  ) {
    return true;
  }

  return externalPackages.some((pkg) => id === pkg || id.startsWith(`${pkg}/`));
};

const baseConfig = {
  external: isExternal,
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
