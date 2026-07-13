import type { ExamDocument } from '../shared/document/schema';
import type {
  AppEnvironment,
  ExportPdfResponse,
  ExportPdfProgress,
  PdfExportVariant,
  ExportTexResponse,
  OpenDocumentResponse,
  RenderMathResponse,
  SaveDocumentResponse,
} from '../shared/ipc/contracts';
import type { ExternalLinkTarget } from '../shared/ipc/external-links';
import type { IpcResult } from '../shared/ipc/result';
import type { CompilerCapabilities, CompilerPreference } from '../shared/compile/types';

export interface ExamZhGuiApi {
  documents: {
    createEmpty(): Promise<IpcResult<ExamDocument>>;
    open(): Promise<IpcResult<OpenDocumentResponse | null>>;
    save(
      document: ExamDocument,
      filePath?: string | null,
    ): Promise<IpcResult<SaveDocumentResponse | null>>;
    saveAs(document: ExamDocument): Promise<IpcResult<SaveDocumentResponse | null>>;
    exportTex(
      document: ExamDocument,
      sourceFilePath?: string | null,
    ): Promise<IpcResult<ExportTexResponse | null>>;
    exportPdf(input: {
      document: ExamDocument;
      sourceFilePath?: string | null;
      jobId: string;
      variants: PdfExportVariant[];
      compilerPreference: CompilerPreference;
      retry?: boolean;
    }): Promise<IpcResult<ExportPdfResponse | null>>;
    onPdfExportProgress(listener: (progress: ExportPdfProgress) => void): () => void;
    revealExportedPdf(filePath: string): Promise<IpcResult<null>>;
  };
  app: {
    getEnvironment(): Promise<IpcResult<AppEnvironment>>;
    getCompilerCapabilities(): Promise<IpcResult<CompilerCapabilities>>;
    openExternal(target: ExternalLinkTarget): Promise<IpcResult<null>>;
  };
  math: {
    render(latex: string, display: boolean): Promise<IpcResult<RenderMathResponse>>;
  };
}

declare global {
  interface Window {
    examZhGui: ExamZhGuiApi;
  }
}

export {};
