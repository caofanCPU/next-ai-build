import { defineConfig } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import { preserveDirectives } from 'rollup-plugin-preserve-directives';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';

// Define export point
const entries = [
  'src/ui/index.ts',
  'src/components/index.ts',
  'src/components/script/index.ts',
  'src/components/server.ts'
];

const createConfig = (format) => ({
  onwarn(warning, warn) {
    // ignore 'use client' and 'use server' directive's warnings in build
    if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
      return;
    }
    warn(warning);
  },
  input: entries,
  external: [
    'react',
    'react-dom',
    'next',
    /^react\//,
    /^react-dom\//,
    /^next\//,
    /^@windrun-huaiin\//,
    /^@radix-ui\//,
    'clsx',
    'tailwind-merge',
    'next-intl',
    'next-themes',
    'tailwindcss',
    'class-variance-authority',
    'lucide-react'
  ],
  plugins: [
    peerDepsExternal(),
    resolve({
      extensions: ['.ts', '.tsx', '.js', '.jsx']
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: format === 'es',
      declarationDir: format === 'es' ? 'dist' : undefined,
      rootDir: 'src',
      exclude: ['**/*.test.ts', '**/*.test.tsx'],
      module: 'esnext'
    }),
    preserveDirectives()
  ],
  output: {
    dir: 'dist',
    format,
    preserveModules: true,
    preserveModulesRoot: 'src',
    entryFileNames: format === 'es' ? '[name].mjs' : '[name].js',
    chunkFileNames: format === 'es' ? '[name]-[hash].mjs' : '[name]-[hash].js',
    exports: 'named'
  }
});

export default defineConfig([
  createConfig('es'),
  createConfig('cjs')
]);