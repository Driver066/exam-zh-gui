import type { ExamDocument } from '../document/schema';
import type {
  CompilerCapabilities,
  CompilerPreference,
  CompilerProviderId,
  PdfCompileDiagnostic,
} from '../compile/types';
import type { TexExportDiagnostic } from '../export/exam-zh';
import type { ExternalLinkTarget } from './external-links';

export const IPC_CHANNELS = {
  appGetEnvironment: 'app:get-environment',
  appOpenExternal: 'app:open-external',
  compilersGetCapabilities: 'compilers:get-capabilities',
  documentsOpen: 'documents:open',
  documentsSave: 'documents:save',
  documentsSaveAs: 'documents:save-as',
  documentsExportTex: 'documents:export-tex',
  documentsExportPdf: 'documents:export-pdf',
  documentsExportPdfProgress: 'documents:export-pdf-progress',
  documentsRevealExportedPdf: 'documents:reveal-exported-pdf',
  mathRender: 'math:render',
} as const;

export interface AppEnvironment {
  appName: string;
  appVersion: string;
  platform: string;
  versions: {
    chrome: string;
    electron: string;
    node: string;
  };
}

export interface OpenExternalPayload {
  target: ExternalLinkTarget;
}

export interface OpenDocumentResponse {
  document: ExamDocument;
  filePath: string;
}

export interface SaveDocumentPayload {
  document: ExamDocument;
  filePath?: string | null;
}

export interface SaveDocumentResponse {
  document: ExamDocument;
  filePath: string;
}

export interface ExportTexPayload {
  document: ExamDocument;
  sourceFilePath?: string | null;
}

export interface ExportTexResponse {
  filePath: string;
  diagnostics: TexExportDiagnostic[];
}

export interface ExportPdfPayload {
  document: ExamDocument;
  sourceFilePath?: string | null;
  jobId: string;
  variants: PdfExportVariant[];
  compilerPreference: CompilerPreference;
  retry?: boolean;
}

export type PdfExportVariant = 'student' | 'teacher';
export type PdfExportProgressPhase = 'exporting' | 'compiling' | 'complete';

export interface ExportPdfProgress {
  jobId: string;
  variant: PdfExportVariant;
  index: number;
  total: number;
  phase: PdfExportProgressPhase;
  success?: boolean;
}

export interface ExportPdfArtifactResult {
  variant: PdfExportVariant;
  success: boolean;
  pdfPath?: string;
  pdfDataBase64?: string;
  provider?: CompilerProviderId;
  diagnostics: PdfCompileDiagnostic[];
  durationMs: number;
  log: string;
}

export interface ExportPdfResponse {
  jobId: string;
  artifacts: ExportPdfArtifactResult[];
}

export interface RevealExportedPdfPayload {
  filePath: string;
}

export type CompilerCapabilitiesResponse = CompilerCapabilities;

export interface RenderMathPayload {
  latex: string;
  display: boolean;
}

export interface RenderMathResponse {
  svg: string;
}
