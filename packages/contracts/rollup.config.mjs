import { defineConfig } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import packageJson from './package.json' with { type: 'json' };

const entries = [
  'src/index.ts',
  'src/ai/index.ts',
  'src/mdx/index.ts'
];

const externalPackages = [
  ...Object.keys(packageJson.dependencies ?? {}),
  ...Object.keys(packageJson.peerDependencies ?? {})
];

const isExternal = (id) => {
  return externalPackages.some((pkg) => id === pkg || id.startsWith(`${pkg}/`));
};

const baseConfig = {
  external: isExternal,
  plugins: [
    peerDepsExternal(),
    resolve({
      extensions: ['.ts', '.tsx', '.js', '.jsx']
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: 'dist',
      rootDir: 'src',
      exclude: ['**/*.test.ts', '**/*.test.tsx'],
      module: 'esnext'
    })
  ]
};

export default defineConfig([
  {
    ...baseConfig,
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
  {
    ...baseConfig,
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
