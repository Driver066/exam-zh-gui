import { describe, expect, it } from 'vitest';

import { renderMathPreviewToSvg } from './math-preview';

describe('main MathJax preview renderer', () => {
  it('renders inline TeX to SVG', async () => {
    const svg = await renderMathPreviewToSvg('x^2', false);

    expect(svg).toContain('<mjx-container');
    expect(svg).toContain('<svg');
  });

  it('renders custom Chinese exam math macros', async () => {
    const svg = await renderMathPreviewToSvg('\\eu^{\\iu x}+\\upe^{\\upi x}+\\uppi', false);

    expect(svg).toContain('<mjx-container');
    expect(svg).toContain('<svg');
  });

  it('renders exam-zh vector previews with app-side normalization', async () => {
    const svg = await renderMathPreviewToSvg('\\vec{x}+\\vec{AB}', false);
    const shorthandSvg = await renderMathPreviewToSvg('\\vec a+\\vec b', false);

    expect(svg).toContain('<mjx-container');
    expect(svg).toContain('<svg');
    expect(shorthandSvg).toContain('<mjx-container');
    expect(shorthandSvg).toContain('<svg');
  });

  it('renders localized exam-zh math symbols used by manual 3.4.3', async () => {
    const svg = await renderMathPreviewToSvg(
      '\\parallelogram+\\paralleleq+\\nsubset+\\nsupset+\\nsubsetneqq+\\nsupsetneqq+\\cong*',
      false,
    );

    expect(svg).toContain('<mjx-container');
    expect(svg).toContain('<svg');
  });
});
