#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const electronModuleDir = dirname(fileURLToPath(import.meta.resolve('electron/package.json')));

if (hasElectronBinary(electronModuleDir)) {
  process.exit(0);
}

console.log('Electron binary not found; installing Electron...');

const installResult = spawnSync(process.execPath, [join(electronModuleDir, 'install.js')], {
  stdio: 'inherit',
});

if (installResult.error) {
  console.error(installResult.error.message);
  process.exit(1);
}

process.exit(installResult.status ?? 1);

function hasElectronBinary(moduleDir) {
  const pathFile = join(moduleDir, 'path.txt');

  if (!existsSync(pathFile)) {
    return false;
  }

  const executablePath = readFileSync(pathFile, 'utf8').trim();

  if (executablePath.length === 0) {
    return false;
  }

  return existsSync(join(moduleDir, 'dist', executablePath));
}
