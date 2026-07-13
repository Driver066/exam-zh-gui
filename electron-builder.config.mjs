import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const configDir = dirname(fileURLToPath(import.meta.url));
const platformArch = `${process.platform}-${process.arch}`;
const tectonicExecutable = process.platform === 'win32' ? 'tectonic.exe' : 'tectonic';
const bundledTectonicPath = join(
  configDir,
  'resources',
  'compiler',
  'tectonic',
  platformArch,
  tectonicExecutable,
);

if (!existsSync(bundledTectonicPath)) {
  throw new Error(
    `Bundled Tectonic binary not found: ${bundledTectonicPath}. Run pnpm tectonic:install-bundled first.`,
  );
}

const extraResources = [
  {
    from: 'resources/latex',
    to: 'latex',
    filter: ['**/*'],
  },
  {
    from: 'out/renderer/pdfjs',
    to: 'pdfjs',
    filter: ['**/*'],
  },
  {
    from: `resources/compiler/tectonic/${platformArch}`,
    to: `compiler/tectonic/${platformArch}`,
    filter: ['**/*', '!**/TECTONIC_BINARY.local.json'],
  },
];

export default {
  appId: 'org.examzhgui.app',
  productName: 'exam-zh GUI',
  directories: {
    output: 'release/mac',
  },
  files: ['out/**/*', 'package.json', 'node_modules/**/*'],
  extraResources,
  asar: true,
  npmRebuild: false,
  mac: {
    target: ['dir'],
    identity: null,
  },
};
