import { describe, expect, it } from 'vitest';

import { findSourceMapEntry, parseLatexLog } from './log-parser';

const sourceMap = [
  { line: 8, path: 'sections.0', label: '第 1 节：选择题' },
  { line: 12, path: 'sections.0.questions.0', label: '第 1 题：单选题' },
  { line: 20, path: 'sections.0.questions.0.solution', label: '第 1 题解析' },
];

describe('LaTeX log parser', () => {
  it('parses file-line errors and maps them to source labels', () => {
    const summary = parseLatexLog('document.tex:13: Undefined control sequence.', {
      texFileName: 'document.tex',
      sourceMap,
    });

    expect(summary.hasErrors).toBe(true);
    expect(summary.diagnostics[0]).toMatchObject({
      code: 'latex_line_error',
      line: 13,
      sourceLabel: '第 1 题：单选题',
    });
  });

  it('treats Tectonic overfull box messages as non-blocking layout info', () => {
    const summary = parseLatexLog(
      'warning: document.tex:13: Overfull \\hbox (2.0075pt too wide) detected at line 13',
      {
        texFileName: 'document.tex',
        sourceMap,
      },
    );

    expect(summary.hasErrors).toBe(false);
    expect(summary.diagnostics[0]).toMatchObject({
      severity: 'info',
      code: 'latex_layout_warning',
      line: 13,
      sourceLabel: '第 1 题：单选题',
      message: '排版提示：这一行内容略微超出可用宽度，不影响 PDF 生成。',
    });
  });

  it('keeps Tectonic file-line warnings distinct from errors', () => {
    const summary = parseLatexLog('warning: document.tex:13: Package example Warning: demo', {
      texFileName: 'document.tex',
      sourceMap,
    });

    expect(summary.hasErrors).toBe(false);
    expect(summary.diagnostics[0]).toMatchObject({
      severity: 'warning',
      code: 'latex_line_warning',
      line: 13,
    });
  });

  it('parses missing packages', () => {
    const summary = parseLatexLog("! LaTeX Error: File `exam-zh.cls' not found.", {
      texFileName: 'document.tex',
      sourceMap,
    });

    expect(summary.diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'latex_missing_file',
        message: '缺少 LaTeX 文件或宏包：exam-zh.cls。',
      }),
    );
  });

  it('parses undefined control sequence context lines', () => {
    const summary = parseLatexLog('! Undefined control sequence.\nl.21 \\unknown', {
      texFileName: 'document.tex',
      sourceMap,
    });

    expect(summary.diagnostics[0]).toMatchObject({
      code: 'latex_undefined_control_sequence',
      line: 21,
      sourceLabel: '第 1 题解析',
    });
  });

  it('detects wrong engine errors', () => {
    const summary = parseLatexLog(
      'Fatal Package fontspec Error: The fontspec package requires either XeTeX or LuaTeX.',
      {
        texFileName: 'document.tex',
      },
    );

    expect(summary.diagnostics[0]).toMatchObject({
      code: 'latex_wrong_engine',
    });
  });

  it('finds the nearest source map entry at or before a line', () => {
    expect(findSourceMapEntry(19, sourceMap)?.label).toBe('第 1 题：单选题');
  });
});
