import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';

import { createEmptyExamDocument } from '../../shared/document';
import type { CompilerProvider } from './providers';
import { buildBatchPdfPaths, normalizePdfVariants, runPdfExportJob } from './pdf-export-job';

describe('PDF export job', () => {
  it('normalizes variants and builds stable batch names', () => {
    expect(normalizePdfVariants(['teacher', 'student', 'teacher'])).toEqual(['student', 'teacher']);
    expect([...buildBatchPdfPaths('/tmp/out', '数学试卷')]).toEqual([
      ['student', join('/tmp/out', '数学试卷-学生版.pdf')],
      ['teacher', join('/tmp/out', '数学试卷-教师版.pdf')],
    ]);
  });

  it('exports variants sequentially without mutating answer mode', async () => {
    const root = await mkdtemp(join(tmpdir(), 'exam-zh-gui-export-job-'));
    const document = createEmptyExamDocument('doc-export-job');
    const observedTex: string[] = [];
    const progress: string[] = [];
    const provider = fakeProvider(async (cwd) => {
      observedTex.push(
        await import('node:fs/promises').then(({ readFile }) =>
          readFile(join(cwd, 'document.tex'), 'utf8'),
        ),
      );
      await writeFile(join(cwd, 'document.pdf'), 'pdf');
      await writeFile(join(cwd, 'document.log'), 'ok');
      return 0;
    });
    const destinations = buildBatchPdfPaths(root, '试卷');
    const results = await runPdfExportJob({
      jobId: 'job-1',
      document,
      variants: ['student', 'teacher'],
      destinations,
      workspaceRoot: join(root, 'workspaces'),
      provider,
      onProgress: (item) => progress.push(`${item.variant}:${item.phase}`),
      readPdfBase64: async () => 'cGRm',
    });

    expect(results.map((result) => result.success)).toEqual([true, true]);
    expect(results.every((result) => !('texPath' in result) && !('logPath' in result))).toBe(true);
    expect(document.setup.answerMode).toBe('student');
    expect(observedTex[0]).toContain('solution/show-solution = hide');
    expect(observedTex[1]).toContain('solution/show-solution = show-stay');
    expect(progress).toEqual([
      'student:exporting',
      'student:compiling',
      'student:complete',
      'teacher:exporting',
      'teacher:compiling',
      'teacher:complete',
    ]);
  });

  it('keeps a successful artifact when the next compile fails', async () => {
    const root = await mkdtemp(join(tmpdir(), 'exam-zh-gui-partial-job-'));
    let callCount = 0;
    const provider = fakeProvider(async (cwd) => {
      callCount += 1;
      await mkdir(cwd, { recursive: true });
      if (callCount === 1) {
        await writeFile(join(cwd, 'document.pdf'), 'pdf');
        await writeFile(join(cwd, 'document.log'), 'ok');
        return 0;
      }
      return 1;
    });
    const results = await runPdfExportJob({
      jobId: 'job-2',
      document: createEmptyExamDocument('doc-partial-job'),
      variants: ['student', 'teacher'],
      destinations: buildBatchPdfPaths(root, '试卷'),
      workspaceRoot: join(root, 'workspaces'),
      provider,
      onProgress: () => undefined,
      readPdfBase64: async () => 'cGRm',
    });
    expect(results[0]?.success).toBe(true);
    expect(results[1]?.success).toBe(false);
  });
});

function fakeProvider(run: (cwd: string) => Promise<number>): CompilerProvider {
  return {
    id: 'xelatex',
    label: 'XeLaTeX',
    async detect() {
      return { id: 'xelatex', available: true };
    },
    async compile(input) {
      const exitCode = await run(input.cwd);
      return {
        provider: 'xelatex',
        exitCode,
        stdout: exitCode === 0 ? 'ok' : 'failed',
        stderr: '',
        log: exitCode === 0 ? 'ok' : 'failed',
        timedOut: false,
      };
    },
  };
}
