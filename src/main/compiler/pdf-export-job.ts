import { join } from 'node:path';

import type { ExamDocument } from '../../shared/document/model';
import type {
  ExportPdfArtifactResult,
  ExportPdfProgress,
  PdfExportVariant,
} from '../../shared/ipc/contracts';
import { exportExamDocumentToTex, hasTexExportErrors } from '../../shared/export/exam-zh';
import type { CompilerProvider } from './providers';
import { compileTexToPdf } from './pdf-compile';

export interface RunPdfExportJobInput {
  jobId: string;
  document: ExamDocument;
  variants: PdfExportVariant[];
  sourceFilePath?: string;
  destinations: Map<PdfExportVariant, string>;
  workspaceRoot: string;
  provider: CompilerProvider;
  onProgress(progress: ExportPdfProgress): void;
  readPdfBase64(path: string): Promise<string>;
}

export async function runPdfExportJob(
  input: RunPdfExportJobInput,
): Promise<ExportPdfArtifactResult[]> {
  const artifacts: ExportPdfArtifactResult[] = [];

  for (const [index, variant] of input.variants.entries()) {
    input.onProgress({
      jobId: input.jobId,
      variant,
      index,
      total: input.variants.length,
      phase: 'exporting',
    });

    let artifact: ExportPdfArtifactResult;
    try {
      const variantDocument: ExamDocument = {
        ...input.document,
        setup: { ...input.document.setup, answerMode: variant },
      };
      const exported = exportExamDocumentToTex(variantDocument, {
        sourceFilePath: input.sourceFilePath,
        compilerTarget: input.provider.id === 'tectonic' ? 'tectonic' : 'standard',
      });

      if (hasTexExportErrors(exported.diagnostics)) {
        artifact = {
          variant,
          success: false,
          diagnostics: exported.diagnostics.map((diagnostic) => ({
            severity: diagnostic.severity,
            code: `export_${diagnostic.code}`,
            message: diagnostic.message,
            sourcePath: diagnostic.path,
          })),
          durationMs: 0,
          log: '',
        };
      } else {
        input.onProgress({
          jobId: input.jobId,
          variant,
          index,
          total: input.variants.length,
          phase: 'compiling',
        });
        const compiled = await compileTexToPdf({
          tex: exported.tex,
          sourceMap: exported.sourceMap,
          outputPdfPath: input.destinations.get(variant)!,
          workspaceRoot: input.workspaceRoot,
          provider: input.provider,
        });
        artifact = {
          ...compiled,
          variant,
          pdfDataBase64: compiled.pdfPath ? await input.readPdfBase64(compiled.pdfPath) : undefined,
          diagnostics: [
            ...exported.diagnostics.map((diagnostic) => ({
              severity: diagnostic.severity,
              code: `export_${diagnostic.code}`,
              message: diagnostic.message,
              sourcePath: diagnostic.path,
            })),
            ...compiled.diagnostics,
          ],
        };
      }
    } catch (error) {
      artifact = {
        variant,
        success: false,
        diagnostics: [
          {
            severity: 'error',
            code: 'export_artifact_failed',
            message: error instanceof Error ? error.message : String(error),
          },
        ],
        durationMs: 0,
        log: '',
      };
    }

    artifacts.push(artifact);
    input.onProgress({
      jobId: input.jobId,
      variant,
      index,
      total: input.variants.length,
      phase: 'complete',
      success: artifact.success,
    });
  }

  return artifacts;
}

export function normalizePdfVariants(variants: PdfExportVariant[]): PdfExportVariant[] {
  return (['student', 'teacher'] as PdfExportVariant[]).filter((variant) =>
    variants.includes(variant),
  );
}

export function buildBatchPdfPaths(
  directory: string,
  safeTitle: string,
): Map<PdfExportVariant, string> {
  return new Map([
    ['student', join(directory, `${safeTitle}-学生版.pdf`)],
    ['teacher', join(directory, `${safeTitle}-教师版.pdf`)],
  ]);
}
