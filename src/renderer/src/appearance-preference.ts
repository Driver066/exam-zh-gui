export type AppAppearance = 'paper' | 'clear';

export const appearancePreferenceStorageKey = 'exam-zh-gui.appearance';

export function normalizeAppearancePreference(value: unknown): AppAppearance | null {
  return value === 'paper' || value === 'clear' ? value : null;
}

export function readAppearancePreference(storage: Pick<Storage, 'getItem'>): AppAppearance {
  return normalizeAppearancePreference(storage.getItem(appearancePreferenceStorageKey)) ?? 'paper';
}

export function writeAppearancePreference(
  storage: Pick<Storage, 'setItem'>,
  appearance: AppAppearance,
): void {
  storage.setItem(appearancePreferenceStorageKey, appearance);
}
