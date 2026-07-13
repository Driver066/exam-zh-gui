import type { TexSourceMapEntry } from '../export/exam-zh';
import type { PdfCompileDiagnostic, PdfCompileLogSummary } from './types';

interface ParseLatexLogOptions {
  texFileName: string;
  sourceMap?: TexSourceMapEntry[];
}

export function parseLatexLog(log: string, options: ParseLatexLogOptions): PdfCompileLogSummary {
  const diagnostics: PdfCompileDiagnostic[] = [];

  diagnostics.push(...parseFileLineErrors(log, options));
  diagnostics.push(...parseMissingPackages(log, options));
  diagnostics.push(...parseUndefinedControlSequences(log, options));
  diagnostics.push(...parseFontOrEngineErrors(log, options));

  const deduped = dedupeDiagnostics(diagnostics);

  return {
    diagnostics: deduped,
    hasErrors: deduped.some((diagnostic) => diagnostic.severity === 'error'),
  };
}

export function findSourceMapEntry(
  line: number,
  sourceMap: TexSourceMapEntry[] = [],
): TexSourceMapEntry | undefined {
  return sourceMap
    .filter((entry) => entry.line <= line)
    .sort((left, right) => right.line - left.line)[0];
}

function parseFileLineErrors(log: string, options: ParseLatexLogOptions): PdfCompileDiagnostic[] {
  const diagnostics: PdfCompileDiagnostic[] = [];
  const escapedFileName = escapeRegExp(options.texFileName);
  const pattern = new RegExp(`(?:^|\\n)([^\\n]*${escapedFileName}):(\\d+):\\s*([^\\n]+)`, 'g');

  for (const match of log.matchAll(pattern)) {
    const line = Number(match[2]);
    const raw = match[0].trim();
    const file = cleanFileLinePrefix(match[1]?.trim() ?? '');
    const message = normalizeLatexMessage(match[3] ?? 'LaTeX 编译错误。');

    diagnostics.push(
      withSourceMap(createFileLineDiagnostic({ file, line, message, raw }), options.sourceMap),
    );
  }

  return diagnostics;
}

function createFileLineDiagnostic(input: {
  file: string;
  line: number;
  message: string;
  raw: string;
}): PdfCompileDiagnostic {
  const layoutMessage = formatLayoutWarningMessage(input.message);

  if (layoutMessage) {
    return {
      severity: 'info',
      code: 'latex_layout_warning',
      message: layoutMessage,
      file: input.file,
      line: input.line,
      raw: input.raw,
    };
  }

  if (/^warning:/i.test(input.raw)) {
    return {
      severity: 'warning',
      code: 'latex_line_warning',
      message: input.message,
      file: input.file,
      line: input.line,
      raw: input.raw,
    };
  }

  return {
    severity: 'error',
    code: 'latex_line_error',
    message: input.message,
    file: input.file,
    line: input.line,
    raw: input.raw,
  };
}

function cleanFileLinePrefix(value: string): string {
  return value.replace(/^warning:\s*/i, '').replace(/^error:\s*/i, '');
}

function formatLayoutWarningMessage(message: string): string | undefined {
  if (/^Overfull \\[hv]box\b/i.test(message)) {
    return '排版提示：这一行内容略微超出可用宽度，不影响 PDF 生成。';
  }

  if (/^Underfull \\[hv]box\b/i.test(message)) {
    return '排版提示：这一处文字间距调整不够理想，不影响 PDF 生成。';
  }

  return undefined;
}

function parseMissingPackages(log: string, options: ParseLatexLogOptions): PdfCompileDiagnostic[] {
  const diagnostics: PdfCompileDiagnostic[] = [];
  const pattern = /LaTeX Error: File `([^']+)' not found\./g;

  for (const match of log.matchAll(pattern)) {
    diagnostics.push(
      withNearestLogLine(
        {
          severity: 'error',
          code: 'latex_missing_file',
          message: `缺少 LaTeX 文件或宏包：${match[1]}。`,
          raw: match[0],
        },
        log,
        match.index ?? 0,
        options.sourceMap,
      ),
    );
  }

  return diagnostics;
}

function parseUndefinedControlSequences(
  log: string,
  options: ParseLatexLogOptions,
): PdfCompileDiagnostic[] {
  const diagnostics: PdfCompileDiagnostic[] = [];
  const pattern = /! Undefined control sequence\./g;

  for (const match of log.matchAll(pattern)) {
    diagnostics.push(
      withNearestLogLine(
        {
          severity: 'error',
          code: 'latex_undefined_control_sequence',
          message: 'LaTeX 命令未定义，请检查题目中的命令或宏包设置。',
          raw: match[0],
        },
        log,
        match.index ?? 0,
        options.sourceMap,
      ),
    );
  }

  return diagnostics;
}

function parseFontOrEngineErrors(
  log: string,
  options: ParseLatexLogOptions,
): PdfCompileDiagnostic[] {
  const diagnostics: PdfCompileDiagnostic[] = [];

  if (/fontspec.+requires either XeTeX or LuaTeX|Fatal Package fontspec Error/i.test(log)) {
    diagnostics.push({
      severity: 'error',
      code: 'latex_wrong_engine',
      message: '当前文件需要 XeLaTeX 或兼容引擎编译，请确认没有使用 pdfLaTeX。',
    });
  }

  if (/font.+not found|The font ".+" cannot be found/i.test(log)) {
    diagnostics.push(
      withNearestLogLine(
        {
          severity: 'error',
          code: 'latex_missing_font',
          message: 'LaTeX 编译时找不到字体，请检查系统中文字体或 exam-zh 字体设置。',
        },
        log,
        0,
        options.sourceMap,
      ),
    );
  }

  return diagnostics;
}

function withNearestLogLine(
  diagnostic: PdfCompileDiagnostic,
  log: string,
  index: number,
  sourceMap?: TexSourceMapEntry[],
): PdfCompileDiagnostic {
  const nearby = log.slice(index, index + 260);
  const lineMatch = nearby.match(/\nl\.(\d+)\s+([^\n]+)/);

  if (!lineMatch) {
    return diagnostic;
  }

  return withSourceMap(
    {
      ...diagnostic,
      line: Number(lineMatch[1]),
      raw: `${diagnostic.raw ?? diagnostic.message}\n${lineMatch[0].trim()}`,
    },
    sourceMap,
  );
}

function withSourceMap(
  diagnostic: PdfCompileDiagnostic,
  sourceMap?: TexSourceMapEntry[],
): PdfCompileDiagnostic {
  if (!diagnostic.line) {
    return diagnostic;
  }

  const entry = findSourceMapEntry(diagnostic.line, sourceMap);

  if (!entry) {
    return diagnostic;
  }

  return {
    ...diagnostic,
    sourcePath: entry.path,
    sourceLabel: entry.label,
  };
}

function dedupeDiagnostics(diagnostics: PdfCompileDiagnostic[]): PdfCompileDiagnostic[] {
  const seen = new Set<string>();
  const deduped: PdfCompileDiagnostic[] = [];

  for (const diagnostic of diagnostics) {
    const key = [
      diagnostic.code,
      diagnostic.message,
      diagnostic.line ?? '',
      diagnostic.sourcePath ?? '',
    ].join('|');

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(diagnostic);
  }

  return deduped;
}

function normalizeLatexMessage(message: string): string {
  return message.trim().replace(/^!+\s*/, '');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
