import { describe, expect, it } from 'vitest';

import { resolveDraftPreviewChoiceColumns } from './draft-preview-layout';

describe('draft preview layout', () => {
  it('uses the upstream four-column cap by default without exceeding the choice count', () => {
    expect(resolveDraftPreviewChoiceColumns(undefined, undefined, 4)).toBe(4);
    expect(resolveDraftPreviewChoiceColumns(undefined, undefined, 1)).toBe(1);
    expect(resolveDraftPreviewChoiceColumns(undefined, undefined, 0)).toBe(0);
  });

  it('uses explicit max columns within the supported preview range', () => {
    expect(resolveDraftPreviewChoiceColumns(undefined, 1, 4)).toBe(1);
    expect(resolveDraftPreviewChoiceColumns(undefined, 2, 4)).toBe(2);
    expect(resolveDraftPreviewChoiceColumns(undefined, 4, 6)).toBe(4);
  });

  it('uses fixed columns before the automatic cap', () => {
    expect(resolveDraftPreviewChoiceColumns(3, 1, 4)).toBe(3);
    expect(resolveDraftPreviewChoiceColumns(4, 2, 2)).toBe(2);
  });

  it('clamps invalid boundaries and the actual choice count', () => {
    expect(resolveDraftPreviewChoiceColumns(undefined, 0, 4)).toBe(1);
    expect(resolveDraftPreviewChoiceColumns(undefined, 8, 6)).toBe(4);
    expect(resolveDraftPreviewChoiceColumns(0, 4, 4)).toBe(1);
  });
});
