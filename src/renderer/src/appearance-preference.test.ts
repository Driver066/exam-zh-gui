import { describe, expect, it } from 'vitest';

import {
  appearancePreferenceStorageKey,
  normalizeAppearancePreference,
  readAppearancePreference,
  writeAppearancePreference,
} from './appearance-preference';

describe('appearance preference', () => {
  it('defaults to the paper appearance for empty or invalid storage', () => {
    expect(readAppearancePreference(createStorage())).toBe('paper');
    expect(
      readAppearancePreference(
        createStorage({
          [appearancePreferenceStorageKey]: 'dark',
        }),
      ),
    ).toBe('paper');
  });

  it('normalizes only supported appearance values', () => {
    expect(normalizeAppearancePreference('paper')).toBe('paper');
    expect(normalizeAppearancePreference('clear')).toBe('clear');
    expect(normalizeAppearancePreference('')).toBeNull();
    expect(normalizeAppearancePreference(null)).toBeNull();
  });

  it('writes and reads both appearances', () => {
    const storage = createStorage();

    writeAppearancePreference(storage, 'clear');
    expect(readAppearancePreference(storage)).toBe('clear');

    writeAppearancePreference(storage, 'paper');
    expect(readAppearancePreference(storage)).toBe('paper');
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
