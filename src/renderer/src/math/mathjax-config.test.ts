import { describe, expect, it } from 'vitest';

import {
  createMathJaxPreviewConfig,
  mathJaxPreviewMacros,
  normalizeExamZhPreviewLatex,
} from './mathjax-config';

describe('MathJax preview config', () => {
  it('defines Chinese exam math macros used by the preview', () => {
    expect(mathJaxPreviewMacros).toMatchObject({
      eu: '\\mathrm{e}',
      upe: '\\mathrm{e}',
      iu: '\\mathrm{i}',
      upi: '\\mathrm{i}',
      uppi: '\\pi',
      parallelogram: '\\mathrel{\\unicode{x25B1}}',
      paralleleq: '\\mathrel{\\overset{\\scriptscriptstyle /\\!/}{=}}',
      nsubset: '\\not\\subset',
      nsupset: '\\not\\supset',
      nsubsetneqq: '\\not\\subsetneqq',
      nsupsetneqq: '\\not\\supsetneqq',
      backcong: '\\cong',
    });
  });

  it('keeps MathJax startup under app control', () => {
    expect(createMathJaxPreviewConfig()).toMatchObject({
      tex: {
        packages: { '[+]': ['ams', 'newcommand', 'noundefined'] },
        macros: mathJaxPreviewMacros,
      },
      startup: {
        typeset: false,
      },
    });
  });

  it('normalizes exam-zh vector previews before MathJax rendering', () => {
    expect(normalizeExamZhPreviewLatex('\\vec{x}+\\vec{AB}')).toBe(
      '\\boldsymbol{x}+\\overrightarrow{AB}',
    );
    expect(normalizeExamZhPreviewLatex('\\vec{ x }+\\vec{A_1}')).toBe(
      '\\boldsymbol{ x }+\\overrightarrow{A_1}',
    );
    expect(normalizeExamZhPreviewLatex('\\vec a+\\vec   b+\\vec A_1')).toBe(
      '\\boldsymbol{a}+\\boldsymbol{b}+\\boldsymbol{A}_1',
    );
  });

  it('normalizes starred original exam-zh symbol previews before MathJax rendering', () => {
    expect(normalizeExamZhPreviewLatex('\\subset*+\\cap*+\\cup*+\\sim*+\\cong*')).toBe(
      '\\subset+\\cap+\\cup+\\sim+\\backcong',
    );
    expect(
      normalizeExamZhPreviewLatex(
        '\\nsubset*+\\subseteq*+\\nsubseteq*+\\subsetneqq*+\\supset*+\\nsupset*+\\supseteq*+\\nsupseteq*+\\supsetneqq*',
      ),
    ).toBe(
      '\\nsubset+\\subseteq+\\nsubseteq+\\subsetneqq+\\supset+\\nsupset+\\supseteq+\\nsupseteq+\\supsetneqq',
    );
  });

  it('leaves unsupported vector forms unchanged', () => {
    expect(normalizeExamZhPreviewLatex('\\vector{x}+\\vec\\alpha+\\vec{AB')).toBe(
      '\\vector{x}+\\vec\\alpha+\\vec{AB',
    );
  });

  it('leaves unsupported starred symbol forms unchanged', () => {
    expect(normalizeExamZhPreviewLatex('\\parallel*+\\paralleleq*+\\nsubsetneqq*')).toBe(
      '\\parallel*+\\paralleleq*+\\nsubsetneqq*',
    );
  });
});
