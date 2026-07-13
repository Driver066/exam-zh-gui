import { app, dialog, ipcMain, shell } from 'electron';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';

import {
  IPC_CHANNELS,
  type ExportPdfArtifactResult,
  type ExportPdfPayload,
  type ExportPdfProgress,
  type ExportPdfResponse,
  type ExportTexPayload,
  type ExportTexResponse,
  type OpenDocumentResponse,
  type SaveDocumentPayload,
  type SaveDocumentResponse,
  type PdfExportVariant,
  type RevealExportedPdfPayload,
} from '../../shared/ipc/contracts';
import { documentValidationErrorMessage, fail, ok } from '../../shared/ipc/result';
import {
  deserializeExamDocument,
  serializeExamDocument,
} from '../../shared/document/serialization';
import { parseExamDocument } from '../../shared/document/schema';
import { exportExamDocumentToTex, hasTexExportErrors } from '../../shared/export/exam-zh';
import { cleanupCompileWorkspaceRoot, getSafePdfDefaultName } from '../compiler/pdf-compile';
import {
  buildBatchPdfPaths,
  normalizePdfVariants,
  runPdfExportJob,
} from '../compiler/pdf-export-job';
import { createSelectableCompilerProviders, resolveCompilerProvider } from '../compiler/providers';

const examJsonFilters = [{ name: 'exam-zh GUI document', extensions: ['examzh.json', 'json'] }];
const texFilters = [{ name: 'LaTeX source', extensions: ['tex'] }];
const pdfFilters = [{ name: 'PDF document', extensions: ['pdf'] }];
const exportedPdfPaths = new Set<string>();
const pdfJobDestinations = new Map<string, Map<PdfExportVariant, string>>();

export function registerDocumentHandlers(): void {
  void app
    .whenReady()
    .then(() => cleanupCompileWorkspaceRoot(join(app.getPath('userData'), 'compile-workspaces')))
    .catch(() => undefined);

  ipcMain.handle(IPC_CHANNELS.documentsOpen, async () => {
    try {
      const selection = await dialog.showOpenDialog({
        title: '打开试卷文档',
        properties: ['openFile'],
        filters: examJsonFilters,
      });

      if (selection.canceled || selection.filePaths.length === 0) {
        return ok<OpenDocumentResponse | null>(null);
      }

      const filePath = selection.filePaths[0];
      const contents = await readFile(filePath, 'utf8');
      const document = deserializeExamDocument(contents);

      return ok<OpenDocumentResponse>({ document, filePath });
    } catch (error) {
      return fail('document_open_failed', documentValidationErrorMessage(error));
    }
  });

  ipcMain.handle(IPC_CHANNELS.documentsSave, async (_event, payload: SaveDocumentPayload) => {
    try {
      const document = parseExamDocument(payload.document);
      const filePath = payload.filePath ?? null;

      if (!filePath) {
        return saveWithDialog(document);
      }

      await writeFile(filePath, serializeExamDocument(document), 'utf8');
      return ok<SaveDocumentResponse>({ document, filePath });
    } catch (error) {
      return fail('document_save_failed', documentValidationErrorMessage(error));
    }
  });

  ipcMain.handle(IPC_CHANNELS.documentsSaveAs, async (_event, payload: SaveDocumentPayload) => {
    try {
      const document = parseExamDocument(payload.document);
      return saveWithDialog(document);
    } catch (error) {
      return fail('document_save_as_failed', documentValidationErrorMessage(error));
    }
  });

  ipcMain.handle(IPC_CHANNELS.documentsExportTex, async (_event, payload: ExportTexPayload) => {
    try {
      const document = parseExamDocument(payload.document);
      const result = exportExamDocumentToTex(document, {
        sourceFilePath: payload.sourceFilePath ?? undefined,
      });

      if (hasTexExportErrors(result.diagnostics)) {
        return fail('document_export_tex_failed', summarizeExportErrors(result.diagnostics));
      }

      const selection = await dialog.showSaveDialog({
        title: '导出 LaTeX 源文件',
        defaultPath: `${sanitizeFileName(document.metadata.title || 'untitled')}.tex`,
        filters: texFilters,
      });

      if (selection.canceled || !selection.filePath) {
        return ok<ExportTexResponse | null>(null);
      }

      await writeFile(selection.filePath, result.tex, 'utf8');
      return ok<ExportTexResponse>({
        filePath: selection.filePath,
        diagnostics: result.diagnostics,
      });
    } catch (error) {
      return fail('document_export_tex_failed', documentValidationErrorMessage(error));
    }
  });

  ipcMain.handle(IPC_CHANNELS.documentsExportPdf, async (event, payload: ExportPdfPayload) => {
    try {
      const document = parseExamDocument(payload.document);
      const variants = normalizePdfVariants(payload.variants);
      if (!payload.jobId.trim() || variants.length === 0) {
        return fail('document_export_pdf_invalid_request', 'PDF 导出任务缺少版本或任务标识。');
      }

      const provider = await resolveCompilerProvider(
        payload.compilerPreference,
        createSelectableCompilerProviders(),
      );
      if (!provider) {
        return ok<ExportPdfResponse>({
          jobId: payload.jobId,
          artifacts: variants.map((variant) =>
            compilerUnavailableArtifact(variant, payload.compilerPreference),
          ),
        });
      }

      const destinations = await choosePdfDestinations(payload, document.metadata.title, variants);
      if (!destinations) return ok<ExportPdfResponse | null>(null);
      rememberPdfJobDestinations(payload.jobId, destinations);

      const artifacts = await runPdfExportJob({
        jobId: payload.jobId,
        document,
        variants,
        sourceFilePath: payload.sourceFilePath ?? undefined,
        destinations,
        workspaceRoot: join(tmpdir(), 'exam-zh-gui', 'compile-workspaces'),
        provider,
        onProgress: (progress) => sendPdfProgress(event.sender, progress),
        readPdfBase64,
      });
      for (const artifact of artifacts) {
        if (artifact.pdfPath) exportedPdfPaths.add(artifact.pdfPath);
      }

      return ok<ExportPdfResponse>({ jobId: payload.jobId, artifacts });
    } catch (error) {
      return fail('document_export_pdf_failed', documentValidationErrorMessage(error));
    }
  });

  ipcMain.handle(
    IPC_CHANNELS.documentsRevealExportedPdf,
    async (_event, payload: RevealExportedPdfPayload) => {
      if (!payload?.filePath || !exportedPdfPaths.has(payload.filePath)) {
        return fail('document_reveal_pdf_invalid_path', '只能定位本次应用会话导出的 PDF。');
      }
      shell.showItemInFolder(payload.filePath);
      return ok(null);
    },
  );
}

async function choosePdfDestinations(
  payload: ExportPdfPayload,
  title: string,
  variants: PdfExportVariant[],
): Promise<Map<PdfExportVariant, string> | null> {
  if (payload.retry) {
    const existing = pdfJobDestinations.get(payload.jobId);
    if (!existing || variants.some((variant) => !existing.has(variant))) {
      throw new Error('无法找到原 PDF 导出路径，请重新生成。');
    }
    return new Map(variants.map((variant) => [variant, existing.get(variant)!]));
  }

  const safeTitle = sanitizeFileName(title || 'untitled');
  if (variants.length === 1) {
    const selection = await dialog.showSaveDialog({
      title: '生成 PDF',
      defaultPath: getSafePdfDefaultName(safeTitle),
      filters: pdfFilters,
    });
    return selection.canceled || !selection.filePath
      ? null
      : new Map([[variants[0]!, selection.filePath]]);
  }

  const selection = await dialog.showOpenDialog({
    title: '选择学生版与教师版 PDF 的保存文件夹',
    properties: ['openDirectory', 'createDirectory'],
  });
  if (selection.canceled || !selection.filePaths[0]) return null;
  const directory = selection.filePaths[0];
  const destinations = buildBatchPdfPaths(directory, safeTitle);
  const conflicts = await findExistingFiles([...destinations.values()]);
  if (conflicts.length > 0) {
    const confirmation = await dialog.showMessageBox({
      type: 'warning',
      buttons: ['替换', '取消'],
      defaultId: 1,
      cancelId: 1,
      title: '替换已有 PDF？',
      message: '以下 PDF 已存在，继续将替换它们：',
      detail: conflicts.map((filePath) => basename(filePath)).join('\n'),
    });
    if (confirmation.response !== 0) return null;
  }
  return destinations;
}

function rememberPdfJobDestinations(
  jobId: string,
  destinations: Map<PdfExportVariant, string>,
): void {
  pdfJobDestinations.set(jobId, new Map(destinations));
  while (pdfJobDestinations.size > 20) {
    const oldest = pdfJobDestinations.keys().next().value;
    if (oldest) pdfJobDestinations.delete(oldest);
    else break;
  }
}

async function findExistingFiles(paths: string[]): Promise<string[]> {
  const checks = await Promise.all(
    paths.map(async (filePath) => {
      try {
        return (await stat(filePath)).isFile() ? filePath : null;
      } catch {
        return null;
      }
    }),
  );
  return checks.filter((filePath): filePath is string => Boolean(filePath));
}

function compilerUnavailableArtifact(
  variant: PdfExportVariant,
  preference: ExportPdfPayload['compilerPreference'],
): ExportPdfArtifactResult {
  const message =
    preference === 'system'
      ? '未检测到本机 latexmk 或 XeLaTeX，请选择自动或内置 Tectonic。'
      : preference === 'tectonic'
        ? '内置 Tectonic 当前不可用，请检查应用资源。'
        : '没有可用的 PDF 编译器。';
  return {
    variant,
    success: false,
    diagnostics: [{ severity: 'error', code: 'compiler_not_found', message }],
    durationMs: 0,
    log: '',
  };
}

function sendPdfProgress(sender: Electron.WebContents, progress: ExportPdfProgress): void {
  sender.send(IPC_CHANNELS.documentsExportPdfProgress, progress);
}

async function saveWithDialog(document: SaveDocumentPayload['document']) {
  const selection = await dialog.showSaveDialog({
    title: '保存试卷文档',
    defaultPath: `${document.metadata.title || 'untitled'}.examzh.json`,
    filters: examJsonFilters,
  });

  if (selection.canceled || !selection.filePath) {
    return ok<SaveDocumentResponse | null>(null);
  }

  await writeFile(selection.filePath, serializeExamDocument(document), 'utf8');
  return ok<SaveDocumentResponse>({ document, filePath: selection.filePath });
}

function summarizeExportErrors(diagnostics: ExportTexResponse['diagnostics']): string {
  return diagnostics
    .filter((diagnostic) => diagnostic.severity === 'error')
    .map((diagnostic) => diagnostic.message)
    .join('\n');
}

function sanitizeFileName(fileName: string): string {
  const normalized = fileName.replace(/[\\/:*?"<>|]/g, '_').trim();
  return normalized.length > 0 ? normalized : 'untitled';
}

async function readPdfBase64(pdfPath: string): Promise<string> {
  const pdf = await readFile(pdfPath);
  return pdf.toString('base64');
}
