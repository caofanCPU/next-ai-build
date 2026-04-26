#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const distCliPath = path.resolve(currentDir, '../dist/cli.js');

if (!fs.existsSync(distCliPath)) {
  console.error('[local-md] CLI build output not found:', distCliPath);
  console.error('[local-md] Run the package build first, then retry.');
  process.exit(1);
}

await import(distCliPath);
