export type TexExportDiagnosticSeverity = 'warning' | 'error';

export interface TexExportDiagnostic {
  severity: TexExportDiagnosticSeverity;
  code: string;
  message: string;
  path?: string;
}

export interface ExportExamZhOptions {
  generatedAt?: string;
  sourceFilePath?: string;
  includeAppMetadata?: boolean;
  compilerTarget?: 'standard' | 'tectonic';
}

export interface ExportExamZhResult {
  tex: string;
  diagnostics: TexExportDiagnostic[];
  sourceMap: TexSourceMapEntry[];
}

export interface TexSourceMapEntry {
  line: number;
  path: string;
  label: string;
}

export function hasTexExportErrors(diagnostics: TexExportDiagnostic[]): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity === 'error');
}
