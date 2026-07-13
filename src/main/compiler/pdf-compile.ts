import { copyFile, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';

import { parseLatexLog } from '../../shared/compile/log-parser';
import type { CompilerProviderId, PdfCompileDiagnostic } from '../../shared/compile/types';
import type { TexSourceMapEntry } from '../../shared/export/exam-zh';
import {
  createCompilerProviders,
  detectPreferredCompilerProvider,
  type CompilerProvider,
} from './providers';

export interface CompilePdfInput {
  tex: string;
  sourceMap: TexSourceMapEntry[];
  outputPdfPath: string;
  workspaceRoot: string;
  provider?: CompilerProvider;
  providers?: CompilerProvider[];
}

export interface CompilePdfResult {
  success: boolean;
  pdfPath?: string;
  provider?: CompilerProviderId;
  diagnostics: PdfCompileDiagnostic[];
  durationMs: number;
  log: string;
}

const texFileName = 'document.tex';
const pdfFileName = 'document.pdf';
const logFileName = 'document.log';

export async function compileTexToPdf(input: CompilePdfInput): Promise<CompilePdfResult> {
  const startedAt = Date.now();
  const workspace = await createCompileWorkspace(input.workspaceRoot);
  let result: CompilePdfResult | undefined;

  try {
    result = await compileInWorkspace(input, workspace, startedAt);
    return result;
  } finally {
    const cleanupError = await removeCompileWorkspace(workspace);
    if (cleanupError && result) {
      result.diagnostics.push({
        severity: 'warning',
        code: 'compile_workspace_cleanup_failed',
        message: 'PDF 任务已结束，但临时编译文件清理失败。请重新启动应用后再试。',
        raw: cleanupError.message,
      });
    }
  }
}

async function compileInWorkspace(
  input: CompilePdfInput,
  workspace: string,
  startedAt: number,
): Promise<CompilePdfResult> {
  const texPath = join(workspace, texFileName);
  const logPath = join(workspace, logFileName);
  const workspacePdfPath = join(workspace, pdfFileName);

  await writeFile(texPath, input.tex, 'utf8');

  const provider =
    input.provider ??
    (await detectPreferredCompilerProvider(input.providers ?? createCompilerProviders()));

  if (!provider) {
    return {
      success: false,
      diagnostics: [
        {
          severity: 'error',
          code: 'compiler_not_found',
          message:
            '当前无法生成 PDF：没有可用的内置 Tectonic 或本机 LaTeX 编译器。请重新检测编译器后重试。',
        },
      ],
      durationMs: Date.now() - startedAt,
      log: '',
    };
  }

  const providerResult = await provider.compile({
    cwd: workspace,
    texFileName,
  });
  const log = await readCompileLog(logPath, providerResult.log);
  const parsed = parseLatexLog(log, {
    texFileName,
    sourceMap: input.sourceMap,
  });
  const diagnostics = [...parsed.diagnostics];
  const pdfExists = await fileExists(workspacePdfPath);
  const success = providerResult.exitCode === 0 && !parsed.hasErrors && pdfExists;

  if (providerResult.timedOut) {
    diagnostics.push({
      severity: 'error',
      code: 'compiler_timeout',
      message: 'PDF 编译超时，请检查是否有无法结束的 LaTeX 编译错误。',
    });
  }

  if (!success && diagnostics.length === 0) {
    diagnostics.push({
      severity: 'error',
      code: 'compiler_failed',
      message: `PDF 编译失败，${provider.label} 返回退出码 ${providerResult.exitCode ?? '未知'}。`,
    });
  }

  if (success) {
    await mkdir(dirname(input.outputPdfPath), { recursive: true }).catch(() => undefined);
    await copyFile(workspacePdfPath, input.outputPdfPath);
  }

  return {
    success,
    pdfPath: success ? input.outputPdfPath : undefined,
    provider: providerResult.provider,
    diagnostics,
    durationMs: Date.now() - startedAt,
    log,
  };
}

async function createCompileWorkspace(workspaceRoot: string): Promise<string> {
  const workspace = join(workspaceRoot, `${Date.now()}-${randomUUID()}`);
  await mkdir(workspace, { recursive: true });
  return workspace;
}

async function removeCompileWorkspace(workspace: string): Promise<Error | undefined> {
  try {
    await rm(workspace, { recursive: true, force: true });
    return undefined;
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
}

export async function cleanupCompileWorkspaceRoot(workspaceRoot: string): Promise<void> {
  await rm(workspaceRoot, { recursive: true, force: true });
}

async function readCompileLog(logPath: string, fallback: string): Promise<string> {
  try {
    const log = await readFile(logPath, 'utf8');
    return [log, fallback].filter(Boolean).join('\n');
  } catch {
    return fallback;
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    const info = await stat(path);
    return info.isFile();
  } catch {
    return false;
  }
}

export function getSafePdfDefaultName(title: string): string {
  const normalized = title.replace(/[\\/:*?"<>|]/g, '_').trim();
  return `${normalized.length > 0 ? normalized : 'untitled'}.pdf`;
}
