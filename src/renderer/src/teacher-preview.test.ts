import { describe, expect, it } from 'vitest';

import type { RichContentBlock, ScoreMark } from '../../shared/document/model';
import { resolvePreviewScorePresentation } from './teacher-preview';

describe('teacher preview score presentation', () => {
  it('uses all score levels for the maximum while listing only trailing levels', () => {
    const scoreMarks: ScoreMark[] = [
      { id: 'score-inline', points: 4, placement: 'inline' },
      { id: 'score-trailing', points: 0 },
    ];
    const solution: RichContentBlock[] = [
      {
        type: 'paragraph',
        children: [{ type: 'scoreRef', scoreMarkId: 'score-inline' }],
      },
    ];

    expect(resolvePreviewScorePresentation(scoreMarks, 'levels', solution)).toEqual({
      displayedScoreMarks: [scoreMarks[1]],
      effectivePoints: 4,
    });
  });

  it('includes inline points in additive totals without listing them twice', () => {
    const scoreMarks: ScoreMark[] = [
      { id: 'score-inline', points: 4, placement: 'inline' },
      { id: 'score-trailing', points: 2 },
    ];
    const solution: RichContentBlock[] = [
      {
        type: 'paragraph',
        children: [{ type: 'scoreRef', scoreMarkId: 'score-inline' }],
      },
    ];

    expect(resolvePreviewScorePresentation(scoreMarks, 'additive', solution)).toEqual({
      displayedScoreMarks: [scoreMarks[1]],
      effectivePoints: 6,
    });
  });
});
