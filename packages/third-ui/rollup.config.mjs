import { defineConfig } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import { preserveDirectives } from 'rollup-plugin-preserve-directives';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';

// Define export point
const entries = [
  'src/clerk/index.ts',
  'src/clerk/server.ts',
  'src/clerk/patch/optional-auth.ts',
  'src/clerk/fingerprint/index.ts',
  'src/clerk/fingerprint/server.ts',
  'src/main/index.ts',
  'src/main/server.ts',
  'src/fuma/server.ts',
  'src/fuma/mdx/index.ts',
  'src/fuma/base/index.ts',
  'src/lib/server.ts'
];

const createConfig = (format) => ({
  onwarn(warning, warn) {
    // ignore 'use client' and 'use server' directive's warnings in build
    if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
      return;
    }
    // ignore circular dependency warnings from third-party libraries
    if (warning.code === 'CIRCULAR_DEPENDENCY' && warning.message.includes('node_modules')) {
      return;
    }
    // ignore mixing named and default exports warnings from third-party libraries
    if (warning.code === 'MIXED_EXPORTS' && (
      warning.message.includes('fingerprintjs') || 
      warning.message.includes('d3-array') ||
      warning.message.includes('node_modules')
    )) {
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
    /^fumadocs/,
    /^@clerk/,
    'clsx',
    'tailwind-merge',
    'next-intl',
    'next-themes',
    'nprogress',
    'tailwindcss'
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
    exports: 'auto'
  }
});

export default defineConfig([
  createConfig('es'),
  createConfig('cjs')
]);
