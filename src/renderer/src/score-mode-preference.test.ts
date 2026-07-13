import { describe, expect, it } from 'vitest';

import {
  normalizeScoreModePreference,
  readScoreModePreference,
  resolveScoreMode,
  scoreModePreferenceStorageKey,
  writeScoreModePreference,
} from './score-mode-preference';

describe('score mode preference', () => {
  it('normalizes stored score modes', () => {
    expect(normalizeScoreModePreference('additive')).toBe('additive');
    expect(normalizeScoreModePreference('levels')).toBe('levels');
    expect(normalizeScoreModePreference('other')).toBeNull();
    expect(normalizeScoreModePreference(null)).toBeNull();
  });

  it('falls back to additive when storage has no valid preference', () => {
    expect(readScoreModePreference(createStorage())).toBe('additive');
    expect(
      readScoreModePreference(createStorage({ [scoreModePreferenceStorageKey]: 'invalid' })),
    ).toBe('additive');
  });

  it('writes and reads a score mode preference', () => {
    const storage = createStorage();

    writeScoreModePreference(storage, 'levels');

    expect(readScoreModePreference(storage)).toBe('levels');
  });

  it('does not override an explicit score mode and preserves legacy additive scoring', () => {
    expect(resolveScoreMode('additive', 'levels')).toBe('additive');
    expect(resolveScoreMode(undefined, 'levels')).toBe('levels');
    expect(resolveScoreMode(undefined, 'levels', true)).toBe('additive');
  });
});

function createStorage(initial: Record<string, string> = {}): Pick<Storage, 'getItem' | 'setItem'> {
  const values = new Map(Object.entries(initial));

  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}
