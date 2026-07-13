import { describe, expect, it } from 'vitest';

const scriptUrl = new URL('../../../scripts/tectonic-ctex-warning-probe.mjs', import.meta.url).href;
const baseTex = String.raw`\documentclass{exam-zh}
\title{未命名试卷}
\subject{数学}
\begin{document}
\maketitle
\end{document}
`;

const ctexLog =
  String.raw`Document Class: ctexbook 2021/12/12 v2.5.8 Chinese adapter
File: ctex-fontset-macold.def 2021/12/12 v2.5.8 macOS fonts definition for Yosemite
Package fontspec Info: Could not resolve font "STHeiti/B" (it probably doesn't exist).
Package fontspec Info: Font family 'STHeiti(0)' created for font 'STHeiti' with options [Script={CJK}].
LaTeX Font Warning: Font shape ` +
  "`TU/STHeiti(0)/b/n'" +
  String.raw` undefined
(Font)              using ` +
  "`TU/STHeiti(0)/m/n'" +
  String.raw` instead on input line 29.
Overfull \hbox (2.0075pt too wide) detected at line 25
\TU/HeitiSCLight(0)/b/n/22.08249 数 学
`;

const baselineLog = String.raw`Document Class: ctexbook 2026/07/01 v2.6.1 Chinese adapter
File: ctex-fontset-macnew.def 2026/07/01 v2.6.1 macOS fonts definition
Package fontspec Info: Could not resolve font "Heiti SC Light/I" (it probably doesn't exist).
Package fontspec Info: Font family 'HeitiSCLight(0)' created for font 'Heiti SC Light' with options [Script={CJK}].
Overfull \hbox (2.0075pt too wide) detected at line 22
\TU/HeitiSCLight(0)/b/n/22.08249 数 学
`;

interface ProbeVariant {
  id: string;
}

describe('Tectonic ctex warning probe script', () => {
  it('keeps the variant list focused on baseline and ctex default', async () => {
    const { ctexWarningProbeVariants } = await import(scriptUrl);

    expect(ctexWarningProbeVariants.map((variant: ProbeVariant) => variant.id)).toEqual([
      'system-baseline',
      'tectonic-ctex-default',
    ]);
  });

  it('builds the ctex default TeX without injecting Fandol', async () => {
    const { buildCtexWarningProbeTex, ctexWarningProbeVariants } = await import(scriptUrl);
    const variant = ctexWarningProbeVariants.find(
      (candidate: ProbeVariant) => candidate.id === 'tectonic-ctex-default',
    );
    const tex = buildCtexWarningProbeTex(baseTex, variant);

    expect(tex).toContain(String.raw`\documentclass{exam-zh}`);
    expect(tex).toContain(String.raw`\cs_if_exist:NF \IfBlankTF`);
    expect(tex).not.toContain('fontset=fandol');
  });

  it('parses CTEX versions, fontset files, font families, and unresolved fonts', async () => {
    const { analyzeCtexLog } = await import(scriptUrl);
    const analysis = analyzeCtexLog(ctexLog);

    expect(analysis.ctexVersions).toEqual([
      expect.objectContaining({ name: 'ctexbook', version: '2.5.8' }),
    ]);
    expect(analysis.fontsetFiles).toEqual([
      expect.objectContaining({ file: 'ctex-fontset-macold.def', kind: 'macold' }),
    ]);
    expect(analysis.fontFamilies).toEqual([
      expect.objectContaining({ family: 'STHeiti(0)', font: 'STHeiti' }),
    ]);
    expect(analysis.unresolvedFonts).toContain('STHeiti/B');
  });

  it('classifies STHeiti bold substitution as visual risk', async () => {
    const { analyzeCtexLog } = await import(scriptUrl);
    const analysis = analyzeCtexLog(ctexLog);

    expect(analysis.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'latex-font-warning',
          category: 'visual-risk',
          message: expect.stringContaining('STHeiti'),
        }),
      ]),
    );
  });

  it('compares baseline shared and ctex-only warning evidence', async () => {
    const { analyzeCtexLog, compareWarningEvidence } = await import(scriptUrl);
    const comparison = compareWarningEvidence(analyzeCtexLog(baselineLog), analyzeCtexLog(ctexLog));

    expect(comparison.baselineShared).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: 'overfull' })]),
    );
    expect(comparison.ctexOnly).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: expect.stringContaining('STHeiti') }),
      ]),
    );
  });

  it('skips PDF font table collection when external tools are unavailable', async () => {
    const { collectPdfFontTable } = await import(scriptUrl);
    const result = await collectPdfFontTable('/tmp/missing.pdf', process.cwd(), {
      pdffonts: '__exam_zh_gui_missing_pdffonts__',
      mutool: '__exam_zh_gui_missing_mutool__',
    });

    expect(result).toEqual(
      expect.objectContaining({
        status: 'skipped',
        reason: 'pdffonts and mutool are not available',
      }),
    );
  });
});
