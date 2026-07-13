import {
  calculateScoreMarksEffectivePoints,
  collectScoreReferenceIds,
} from '../../shared/document';
import type { RichContentBlock, ScoreMark, ScoreMode } from '../../shared/document/model';

export interface PreviewScorePresentation {
  displayedScoreMarks: ScoreMark[];
  effectivePoints: number;
}

export function resolvePreviewScorePresentation(
  scoreMarks: ScoreMark[],
  scoreMode: ScoreMode | undefined,
  solution: RichContentBlock[] | undefined,
): PreviewScorePresentation {
  const referencedIds = new Set(collectScoreReferenceIds(solution));

  return {
    displayedScoreMarks: scoreMarks.filter((item) => !referencedIds.has(item.id)),
    effectivePoints: calculateScoreMarksEffectivePoints(scoreMarks, scoreMode),
  };
}
