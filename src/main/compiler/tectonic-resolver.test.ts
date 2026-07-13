import { chmod, mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';

import {
  getBundledTectonicCandidatePaths,
  getTectonicExecutableName,
  getTectonicPlatformArch,
  resolveTectonicBinary,
} from './tectonic-resolver';

describe('Tectonic binary resolver', () => {
  it('builds platform-arch resource paths', () => {
    expect(getTectonicPlatformArch('darwin', 'arm64')).toBe('darwin-arm64');
    expect(getTectonicExecutableName('darwin')).toBe('tectonic');
    expect(getTectonicExecutableName('win32')).toBe('tectonic.exe');
    expect(
      getBundledTectonicCandidatePaths({
        platform: 'darwin',
        arch: 'arm64',
        resourcesPath: '/App/Contents/Resources',
        cwd: '/repo',
      }),
    ).toEqual([
      '/App/Contents/Resources/compiler/tectonic/darwin-arm64/tectonic',
      '/repo/resources/compiler/tectonic/darwin-arm64/tectonic',
    ]);
  });

  it('prefers process.resourcesPath bundled binaries over development resources', async () => {
    const root = await mkdtemp(join(tmpdir(), 'exam-zh-gui-tectonic-resolver-'));
    const resourcesPath = join(root, 'app-resources');
    const cwd = join(root, 'repo');
    const appBinary = await createExecutable(
      join(resourcesPath, 'compiler/tectonic/darwin-arm64/tectonic'),
    );
    await createExecutable(join(cwd, 'resources/compiler/tectonic/darwin-arm64/tectonic'));

    const resolved = await resolveTectonicBinary({
      platform: 'darwin',
      arch: 'arm64',
      resourcesPath,
      cwd,
      env: {},
    });

    expect(resolved.command).toBe(appBinary);
    expect(resolved.candidates[0]).toEqual({ kind: 'bundled', command: appBinary });
  });

  it('prefers bundled binaries over TECTONIC_BIN and PATH', async () => {
    const root = await mkdtemp(join(tmpdir(), 'exam-zh-gui-tectonic-bundled-'));
    const bundled = await createExecutable(
      join(root, 'resources/compiler/tectonic/darwin-arm64/tectonic'),
    );

    const resolved = await resolveTectonicBinary({
      platform: 'darwin',
      arch: 'arm64',
      cwd: root,
      env: { TECTONIC_BIN: '/opt/bin/tectonic' },
    });

    expect(resolved.command).toBe(bundled);
  });

  it('falls back to TECTONIC_BIN when no bundled binary is executable', async () => {
    const root = await mkdtemp(join(tmpdir(), 'exam-zh-gui-tectonic-env-'));
    await createNonExecutable(join(root, 'resources/compiler/tectonic/darwin-arm64/tectonic'));

    const resolved = await resolveTectonicBinary({
      platform: 'darwin',
      arch: 'arm64',
      cwd: root,
      env: { TECTONIC_BIN: '/opt/bin/tectonic' },
    });

    expect(resolved.command).toBe('/opt/bin/tectonic');
    expect(resolved.candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'bundled', command: expect.any(String) }),
        { kind: 'env', command: '/opt/bin/tectonic' },
      ]),
    );
  });

  it('falls back to PATH when no bundled binary or env override exists', async () => {
    const resolved = await resolveTectonicBinary({
      platform: 'darwin',
      arch: 'arm64',
      cwd: '/definitely/missing',
      env: {},
    });

    expect(resolved.command).toBe('tectonic');
    expect(resolved.candidates.at(-1)).toEqual({ kind: 'path', command: 'tectonic' });
  });
});

async function createExecutable(path: string): Promise<string> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, '#!/bin/sh\nexit 0\n', 'utf8');
  await chmod(path, 0o755);
  return path;
}

async function createNonExecutable(path: string): Promise<string> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, '#!/bin/sh\nexit 0\n', 'utf8');
  await chmod(path, 0o644);
  return path;
}
