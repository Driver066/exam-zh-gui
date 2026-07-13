import { describe, expect, it } from 'vitest';

const scriptUrl = new URL('../../../scripts/tectonic-font-probe.mjs', import.meta.url).href;
const baseTex = String.raw`\documentclass{exam-zh}
\title{未命名试卷}
\subject{数学}
\begin{document}
\maketitle
\end{document}
`;

interface FontProbeVariant {
  id: string;
}

describe('Tectonic font probe script', () => {
  it('keeps the variant list stable', async () => {
    const { fontProbeVariants } = await import(scriptUrl);

    expect(fontProbeVariants.map((variant: FontProbeVariant) => variant.id)).toEqual([
      'system-baseline',
      'tectonic-fandol-current',
      'tectonic-mac-fontset',
      'tectonic-ctex-default',
      'tectonic-fandol-subject-serif',
      'tectonic-fandol-subject-smaller-sans',
    ]);
  });

  it('keeps the system baseline TeX unchanged', async () => {
    const { buildFontProbeTex, fontProbeVariants } = await import(scriptUrl);
    const variant = fontProbeVariants.find(
      (candidate: FontProbeVariant) => candidate.id === 'system-baseline',
    );

    expect(buildFontProbeTex(baseTex, variant)).toBe(baseTex);
  });

  it('builds the current Tectonic Fandol variant with the compatibility shim', async () => {
    const { buildFontProbeTex, fontProbeVariants } = await import(scriptUrl);
    const variant = fontProbeVariants.find(
      (candidate: FontProbeVariant) => candidate.id === 'tectonic-fandol-current',
    );
    const tex = buildFontProbeTex(baseTex, variant);

    expect(tex).toContain(String.raw`\documentclass[fontset=fandol]{exam-zh}`);
    expect(tex).toContain(String.raw`\cs_if_exist:NF \IfBlankTF`);
  });

  it('builds the ctex default variant without auto-injecting Fandol', async () => {
    const { buildFontProbeTex, fontProbeVariants } = await import(scriptUrl);
    const variant = fontProbeVariants.find(
      (candidate: FontProbeVariant) => candidate.id === 'tectonic-ctex-default',
    );
    const tex = buildFontProbeTex(baseTex, variant);

    expect(tex).toContain(String.raw`\documentclass{exam-zh}`);
    expect(tex).not.toContain('fontset=fandol');
    expect(tex).toContain(String.raw`\cs_if_exist:NF \IfBlankTF`);
  });

  it('keeps subject-format overrides local to probe variants', async () => {
    const { buildFontProbeTex, fontProbeVariants } = await import(scriptUrl);
    const serif = fontProbeVariants.find(
      (candidate: FontProbeVariant) => candidate.id === 'tectonic-fandol-subject-serif',
    );
    const current = fontProbeVariants.find(
      (candidate: FontProbeVariant) => candidate.id === 'tectonic-fandol-current',
    );

    expect(buildFontProbeTex(baseTex, serif)).toContain(
      String.raw`subject-format = \rmfamily\bfseries\huge`,
    );
    expect(buildFontProbeTex(baseTex, current)).not.toContain('subject-format');
  });
});
