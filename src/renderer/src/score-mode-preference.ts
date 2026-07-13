import type { ScoreMode } from '../../shared/document/model';

export const scoreModePreferenceStorageKey = 'exam-zh-gui.preferred-score-mode';

export function normalizeScoreModePreference(value: unknown): ScoreMode | null {
  return value === 'additive' || value === 'levels' ? value : null;
}

export function readScoreModePreference(storage: Pick<Storage, 'getItem'>): ScoreMode {
  return normalizeScoreModePreference(storage.getItem(scoreModePreferenceStorageKey)) ?? 'additive';
}

export function writeScoreModePreference(
  storage: Pick<Storage, 'setItem'>,
  scoreMode: ScoreMode,
): void {
  storage.setItem(scoreModePreferenceStorageKey, scoreMode);
}

export function resolveScoreMode(
  scoreMode: ScoreMode | undefined,
  preferredScoreMode: ScoreMode,
  hasScoreMarks = false,
): ScoreMode {
  if (scoreMode) {
    return scoreMode;
  }

  return hasScoreMarks ? 'additive' : preferredScoreMode;
}
