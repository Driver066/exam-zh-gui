import { access, mkdir, mkdtemp, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';

import type { CompilerProvider } from './providers';
import { cleanupCompileWorkspaceRoot, compileTexToPdf, getSafePdfDefaultName } from './pdf-compile';

describe('PDF compile service', () => {
  it('returns an actionable diagnostic when no compiler is available', async () => {
    const root = await mkdtemp(join(tmpdir(), 'exam-zh-gui-no-compiler-'));
    const workspaceRoot = join(root, 'workspaces');
    const result = await compileTexToPdf({
      tex: '\\documentclass{exam-zh}',
      sourceMap: [],
      outputPdfPath: join(root, 'out.pdf'),
      workspaceRoot,
      providers: [],
    });

    expect(result.success).toBe(false);
    expect(result.diagnostics[0]).toMatchObject({
      code: 'compiler_not_found',
    });
    await expectWorkspaceRootToBeEmpty(workspaceRoot);
  });

  it('returns mapped diagnostics when compilation fails', async () => {
    const root = await mkdtemp(join(tmpdir(), 'exam-zh-gui-compile-fail-'));
    const workspaceRoot = join(root, 'workspaces');
    const provider = createFakeProvider(async () => ({
      exitCode: 1,
      log: 'document.tex:12: Undefined control sequence.',
      writePdf: false,
    }));
    const result = await compileTexToPdf({
      tex: '\\documentclass{exam-zh}',
      sourceMap: [{ line: 10, path: 'sections.0.questions.0', label: '第 1 题：单选题' }],
      outputPdfPath: join(root, 'out.pdf'),
      workspaceRoot,
      providers: [provider],
    });

    expect(result.success).toBe(false);
    expect(result.diagnostics[0]).toMatchObject({
      code: 'latex_line_error',
      sourceLabel: '第 1 题：单选题',
    });
    expect(result).not.toHaveProperty('texPath');
    expect(result).not.toHaveProperty('logPath');
    await expectWorkspaceRootToBeEmpty(workspaceRoot);
  });

  it('cleans the workspace when the compiler throws', async () => {
    const root = await mkdtemp(join(tmpdir(), 'exam-zh-gui-compile-throw-'));
    const workspaceRoot = join(root, 'workspaces');
    const provider = createFakeProvider(async () => {
      throw new Error('compiler crashed');
    });

    await expect(
      compileTexToPdf({
        tex: '\\documentclass{exam-zh}',
        sourceMap: [],
        outputPdfPath: join(root, 'out.pdf'),
        workspaceRoot,
        providers: [provider],
      }),
    ).rejects.toThrow('compiler crashed');
    await expectWorkspaceRootToBeEmpty(workspaceRoot);
  });

  it('copies the generated PDF when compilation succeeds', async () => {
    const root = await mkdtemp(join(tmpdir(), 'exam-zh-gui-compile-ok-'));
    const workspaceRoot = join(root, 'workspaces');
    const outputPdfPath = join(root, 'out.pdf');
    const provider = createFakeProvider(async (cwd) => {
      await writeFile(join(cwd, 'document.pdf'), 'pdf');
      await writeFile(join(cwd, 'document.log'), 'ok');
      return { exitCode: 0, log: 'ok', writePdf: true };
    });
    const result = await compileTexToPdf({
      tex: '\\documentclass{exam-zh}',
      sourceMap: [],
      outputPdfPath,
      workspaceRoot,
      providers: [provider],
    });

    expect(result.success).toBe(true);
    expect(result.pdfPath).toBe(outputPdfPath);
    expect(result.diagnostics).toEqual([]);
    await expect(access(outputPdfPath)).resolves.toBeUndefined();
    await expectWorkspaceRootToBeEmpty(workspaceRoot);
  });

  it('does not fail PDF output for non-blocking layout diagnostics', async () => {
    const root = await mkdtemp(join(tmpdir(), 'exam-zh-gui-compile-info-'));
    const workspaceRoot = join(root, 'workspaces');
    const outputPdfPath = join(root, 'out.pdf');
    const provider = createFakeProvider(async (cwd) => {
      await writeFile(join(cwd, 'document.pdf'), 'pdf');
      await writeFile(
        join(cwd, 'document.log'),
        'warning: document.tex:12: Overfull \\hbox (2.0075pt too wide) detected at line 12',
      );
      return { exitCode: 0, log: '', writePdf: true };
    });
    const result = await compileTexToPdf({
      tex: '\\documentclass{exam-zh}',
      sourceMap: [{ line: 10, path: 'sections.0.questions.0', label: '第 1 题：单选题' }],
      outputPdfPath,
      workspaceRoot,
      providers: [provider],
    });

    expect(result.success).toBe(true);
    expect(result.pdfPath).toBe(outputPdfPath);
    expect(result.diagnostics[0]).toMatchObject({
      severity: 'info',
      code: 'latex_layout_warning',
      sourceLabel: '第 1 题：单选题',
    });
    await expectWorkspaceRootToBeEmpty(workspaceRoot);
  });

  it('removes legacy compile workspace trees', async () => {
    const root = await mkdtemp(join(tmpdir(), 'exam-zh-gui-legacy-workspaces-'));
    const workspaceRoot = join(root, 'compile-workspaces');
    await mkdir(join(workspaceRoot, 'old-job'), { recursive: true });
    await writeFile(join(workspaceRoot, 'old-job', 'document.tex'), 'temporary');

    await cleanupCompileWorkspaceRoot(workspaceRoot);

    await expect(access(workspaceRoot)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('sanitizes PDF default names', () => {
    expect(getSafePdfDefaultName('A/B:C')).toBe('A_B_C.pdf');
    expect(getSafePdfDefaultName('   ')).toBe('untitled.pdf');
  });
});

async function expectWorkspaceRootToBeEmpty(workspaceRoot: string): Promise<void> {
  expect(await readdir(workspaceRoot)).toEqual([]);
}

function createFakeProvider(
  compile: (cwd: string) => Promise<{ exitCode: number; log: string; writePdf: boolean }>,
): CompilerProvider {
  return {
    id: 'xelatex',
    label: 'XeLaTeX',
    async detect() {
      return { id: 'xelatex', available: true };
    },
    async compile(input) {
      const result = await compile(input.cwd);

      return {
        provider: 'xelatex',
        exitCode: result.exitCode,
        stdout: result.log,
        stderr: '',
        log: result.log,
        timedOut: false,
      };
    },
  };
}
