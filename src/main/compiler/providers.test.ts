import { chmod, mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';

import type { CommandRunner } from './command-runner';
import {
  buildLatexmkCommand,
  buildTectonicCommand,
  buildXelatexCommand,
  copyTectonicExamZhResources,
  createCompilerProviders,
  createSelectableCompilerProviders,
  createTectonicProvider,
  detectCompilerCapabilities,
  detectPreferredCompilerProvider,
  resolveCompilerProvider,
} from './providers';
import { getTectonicExecutableName, getTectonicPlatformArch } from './tectonic-resolver';

describe('compiler providers', () => {
  it('builds fixed latexmk xelatex commands without shell strings', () => {
    expect(buildLatexmkCommand('document.tex')).toEqual({
      command: 'latexmk',
      args: [
        '-xelatex',
        '-interaction=nonstopmode',
        '-halt-on-error',
        '-file-line-error',
        'document.tex',
      ],
    });
  });

  it('builds fixed xelatex commands', () => {
    expect(buildXelatexCommand('document.tex')).toEqual({
      command: 'xelatex',
      args: ['-interaction=nonstopmode', '-halt-on-error', '-file-line-error', 'document.tex'],
    });
  });

  it('builds fixed tectonic commands for warm runs', () => {
    expect(buildTectonicCommand({ texFileName: 'document.tex', outDir: '/tmp/workspace' })).toEqual(
      {
        command: 'tectonic',
        args: [
          '--untrusted',
          '--keep-logs',
          '--keep-intermediates',
          '--outdir',
          '/tmp/workspace',
          '--reruns',
          '2',
          'document.tex',
        ],
      },
    );
  });

  it('builds tectonic offline commands with binary overrides', () => {
    expect(
      buildTectonicCommand({
        texFileName: 'document.tex',
        outDir: '/tmp/workspace',
        tectonicBin: '/opt/bin/tectonic',
        onlyCached: true,
        untrusted: true,
      }),
    ).toEqual({
      command: '/opt/bin/tectonic',
      args: [
        '--only-cached',
        '--untrusted',
        '--keep-logs',
        '--keep-intermediates',
        '--outdir',
        '/tmp/workspace',
        '--reruns',
        '2',
        'document.tex',
      ],
    });
  });

  it('prefers latexmk over xelatex when both are available', async () => {
    const runner = createFakeRunner({ latexmk: 0, xelatex: 0 });
    const provider = await detectPreferredCompilerProvider(
      createCompilerProviders(runner, { enableTectonic: false }),
    );

    expect(provider?.id).toBe('latexmk-xelatex');
  });

  it('falls back to xelatex when latexmk is unavailable', async () => {
    const runner = createFakeRunner({ latexmk: null, xelatex: 0 });
    const provider = await detectPreferredCompilerProvider(
      createCompilerProviders(runner, { enableTectonic: false }),
    );

    expect(provider?.id).toBe('xelatex');
  });

  it('returns null when no provider is available', async () => {
    const runner = createFakeRunner({ latexmk: null, xelatex: null });
    const provider = await detectPreferredCompilerProvider(
      createCompilerProviders(runner, { enableTectonic: false }),
    );

    expect(provider).toBeNull();
  });

  it('keeps tectonic out of the default provider list unless explicitly enabled', () => {
    const providers = createCompilerProviders(createFakeRunner({}), { enableTectonic: false });

    expect(providers.map((provider) => provider.id)).toEqual(['latexmk-xelatex', 'xelatex']);
  });

  it('puts tectonic first when the experiment is enabled', async () => {
    const runner = createFakeRunner({ tectonic: 0, latexmk: 0, xelatex: 0 });
    const providers = createCompilerProviders(runner, {
      enableTectonic: true,
      tectonicCwd: await createIsolatedCwd(),
    });
    const provider = await detectPreferredCompilerProvider(providers);

    expect(providers.map((candidate) => candidate.id)).toEqual([
      'tectonic',
      'latexmk-xelatex',
      'xelatex',
    ]);
    expect(provider?.id).toBe('tectonic');
  });

  it('detects tectonic with a custom binary path', async () => {
    const calls: string[] = [];
    const runner: CommandRunner = {
      async run(command, args) {
        calls.push(`${command} ${args.join(' ')}`);
        return { exitCode: 0, stdout: 'Tectonic 0.15.0', stderr: '', timedOut: false };
      },
    };
    const tectonic = createTectonicProvider(runner, {
      cwd: await createIsolatedCwd(),
      tectonicBin: '/opt/bin/tectonic',
    });

    const detection = await tectonic.detect();

    expect(detection).toMatchObject({ id: 'tectonic', available: true });
    expect(calls[0]).toBe('/opt/bin/tectonic --version');
  });

  it('detects Tectonic with a bundled binary before env overrides', async () => {
    const root = await mkdtemp(join(tmpdir(), 'exam-zh-gui-tectonic-bundled-provider-'));
    const bundledBinary = await createExecutable(
      join(
        root,
        'resources/compiler/tectonic',
        getTectonicPlatformArch(),
        getTectonicExecutableName(),
      ),
    );
    const calls: string[] = [];
    const runner: CommandRunner = {
      async run(command, args) {
        calls.push(`${command} ${args.join(' ')}`);
        return { exitCode: 0, stdout: 'Tectonic bundled', stderr: '', timedOut: false };
      },
    };
    const tectonic = createTectonicProvider(runner, {
      cwd: root,
      env: { TECTONIC_BIN: '/opt/bin/tectonic' },
    });

    const detection = await tectonic.detect();

    expect(detection).toMatchObject({ id: 'tectonic', available: true });
    expect(calls[0]).toBe(`${bundledBinary} --version`);
  });

  it('reports a readable detail when bundled Tectonic is not executable', async () => {
    const root = await mkdtemp(join(tmpdir(), 'exam-zh-gui-tectonic-bundled-bad-'));
    await createNonExecutable(
      join(
        root,
        'resources/compiler/tectonic',
        getTectonicPlatformArch(),
        getTectonicExecutableName(),
      ),
    );
    const runner = createFakeRunner({ tectonic: null });
    const tectonic = createTectonicProvider(runner, {
      cwd: root,
      env: {},
    });

    const detection = await tectonic.detect();

    expect(detection.available).toBe(false);
    expect(detection.detail).toContain('内置 Tectonic binary 不可用');
    expect(detection.detail).toContain('TECTONIC_BIN');
  });

  it('aggregates tectonic compile output into the provider log', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'exam-zh-gui-tectonic-provider-'));
    const resourceDir = await createTestExamZhResourceDir();
    const runner: CommandRunner = {
      async run() {
        return { exitCode: 1, stdout: 'stdout log', stderr: 'stderr log', timedOut: false };
      },
    };
    const tectonic = createTectonicProvider(runner, { resourceDir });

    const result = await tectonic.compile({ cwd: workspace, texFileName: 'document.tex' });

    expect(result).toMatchObject({
      provider: 'tectonic',
      exitCode: 1,
      log: 'stdout log\nstderr log',
    });
  });

  it('copies vendored exam-zh resources before Tectonic compilation', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'exam-zh-gui-tectonic-copy-'));
    const resourceDir = await createTestExamZhResourceDir();

    const result = await copyTectonicExamZhResources(workspace, resourceDir);

    expect(result).toEqual({ ok: true, copiedFiles: ['exam-zh-test.cls', 'exam-zh-test.sty'] });
    expect(await readFile(join(workspace, 'exam-zh-test.cls'), 'utf8')).toBe('% class');
    await expect(readdir(workspace)).resolves.not.toContain('README.md');
  });

  it('returns a readable error when Tectonic resources are missing', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'exam-zh-gui-tectonic-missing-'));
    const runner: CommandRunner = {
      async run() {
        throw new Error('runner should not be called');
      },
    };
    const tectonic = createTectonicProvider(runner, { resourceDir: join(workspace, 'missing') });

    const result = await tectonic.compile({ cwd: workspace, texFileName: 'document.tex' });

    expect(result.exitCode).toBe(1);
    expect(result.log).toContain('Tectonic 实验编译缺少 exam-zh 运行资源');
  });

  it('passes offline Tectonic provider options into the command', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'exam-zh-gui-tectonic-offline-'));
    const resourceDir = await createTestExamZhResourceDir();
    const calls: string[] = [];
    const runner: CommandRunner = {
      async run(command, args) {
        calls.push(`${command} ${args.join(' ')}`);
        return { exitCode: 0, stdout: 'ok', stderr: '', timedOut: false };
      },
    };
    const tectonic = createCompilerProviders(runner, {
      enableTectonic: true,
      tectonicOnlyCached: true,
      tectonicResourceDir: resourceDir,
      tectonicCwd: await createIsolatedCwd(),
    })[0];

    await tectonic.compile({ cwd: workspace, texFileName: 'document.tex' });

    expect(calls[0]).toContain('tectonic --only-cached --untrusted');
  });

  it('runs xelatex twice for fallback compilation', async () => {
    const calls: string[] = [];
    const runner: CommandRunner = {
      async run(command, args) {
        calls.push(`${command} ${args.join(' ')}`);
        return { exitCode: 0, stdout: 'ok', stderr: '', timedOut: false };
      },
    };
    const xelatex = createCompilerProviders(runner, { enableTectonic: false }).find(
      (provider) => provider.id === 'xelatex',
    );

    await xelatex?.compile({ cwd: '/tmp/example', texFileName: 'document.tex' });

    expect(calls).toHaveLength(2);
    expect(calls[0]).toContain('xelatex');
  });

  it('detects selectable compiler capabilities and prefers system LaTeX automatically', async () => {
    const providers = createSelectableCompilerProviders(
      createFakeRunner({ latexmk: 0, xelatex: 0, tectonic: 0 }),
      {
        tectonicBin: 'tectonic',
        tectonicCwd: await createIsolatedCwd(),
      },
    );
    const capabilities = await detectCompilerCapabilities(providers);
    expect(capabilities.systemProvider).toBe('latexmk-xelatex');
    expect(capabilities.automaticProvider).toBe('latexmk-xelatex');
    expect(capabilities.tectonicAvailable).toBe(true);
    expect((await resolveCompilerProvider('auto', providers))?.id).toBe('latexmk-xelatex');
    expect((await resolveCompilerProvider('tectonic', providers))?.id).toBe('tectonic');
  });

  it('uses bundled Tectonic automatically when system LaTeX is unavailable', async () => {
    const providers = createSelectableCompilerProviders(
      createFakeRunner({ latexmk: 1, xelatex: 1, tectonic: 0 }),
      {
        tectonicBin: 'tectonic',
        tectonicCwd: await createIsolatedCwd(),
      },
    );
    expect((await resolveCompilerProvider('auto', providers))?.id).toBe('tectonic');
    expect(await resolveCompilerProvider('system', providers)).toBeNull();
  });
});

async function createTestExamZhResourceDir(): Promise<string> {
  const resourceDir = await mkdtemp(join(tmpdir(), 'exam-zh-gui-tectonic-resource-'));
  await writeFile(join(resourceDir, 'exam-zh-test.cls'), '% class', 'utf8');
  await writeFile(join(resourceDir, 'exam-zh-test.sty'), '% package', 'utf8');
  await writeFile(join(resourceDir, 'README.md'), 'not copied', 'utf8');
  return resourceDir;
}

async function createIsolatedCwd(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'exam-zh-gui-tectonic-isolated-'));
}

async function createExecutable(path: string): Promise<string> {
  await mkdirParent(path);
  await writeFile(path, '#!/bin/sh\nexit 0\n', 'utf8');
  await chmod(path, 0o755);
  return path;
}

async function createNonExecutable(path: string): Promise<string> {
  await mkdirParent(path);
  await writeFile(path, '#!/bin/sh\nexit 0\n', 'utf8');
  await chmod(path, 0o644);
  return path;
}

async function mkdirParent(path: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
}

function createFakeRunner(exitCodes: Record<string, number | null>): CommandRunner {
  return {
    async run(command) {
      const exitCode = exitCodes[command] ?? null;

      return {
        exitCode,
        stdout: exitCode === 0 ? `${command} version` : '',
        stderr: exitCode === 0 ? '' : 'not found',
        timedOut: false,
      };
    },
  };
}
