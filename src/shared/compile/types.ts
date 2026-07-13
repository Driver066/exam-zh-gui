export type CompilerProviderId = 'latexmk-xelatex' | 'xelatex' | 'tectonic';
export type CompilerPreference = 'auto' | 'tectonic' | 'system';

export interface CompilerProviderCapability {
  id: CompilerProviderId;
  label: string;
  available: boolean;
  detail?: string;
}

export interface CompilerCapabilities {
  providers: CompilerProviderCapability[];
  automaticProvider?: CompilerProviderId;
  systemProvider?: CompilerProviderId;
  tectonicAvailable: boolean;
}

export type PdfCompileDiagnosticSeverity = 'error' | 'warning' | 'info';

export interface PdfCompileDiagnostic {
  severity: PdfCompileDiagnosticSeverity;
  code: string;
  message: string;
  file?: string;
  line?: number;
  raw?: string;
  sourcePath?: string;
  sourceLabel?: string;
}

export interface PdfCompileLogSummary {
  diagnostics: PdfCompileDiagnostic[];
  hasErrors: boolean;
}
