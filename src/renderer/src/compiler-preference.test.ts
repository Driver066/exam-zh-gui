import { describe, expect, it } from 'vitest';

import type { CompilerCapabilities } from '../../shared/compile/types';
import {
  compilerPreferenceStorageKey,
  normalizeAvailableCompilerPreference,
  readCompilerPreference,
  resolvePreferredProviderLabel,
  writeCompilerPreference,
} from './compiler-preference';

const capabilities: CompilerCapabilities = {
  providers: [
    { id: 'latexmk-xelatex', label: 'latexmk + XeLaTeX', available: true },
    { id: 'xelatex', label: 'XeLaTeX', available: true },
    { id: 'tectonic', label: 'Tectonic', available: true },
  ],
  automaticProvider: 'latexmk-xelatex',
  systemProvider: 'latexmk-xelatex',
  tectonicAvailable: true,
};

describe('compiler preference', () => {
  it('defaults invalid values to auto and persists valid values', () => {
    const data = new Map<string, string>();
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
    };
    expect(readCompilerPreference(storage)).toBe('auto');
    writeCompilerPreference(storage, 'system');
    expect(data.get(compilerPreferenceStorageKey)).toBe('system');
    expect(readCompilerPreference(storage)).toBe('system');
  });

  it('falls back from unavailable explicit system preference', () => {
    const unavailable = { ...capabilities, systemProvider: undefined };
    expect(normalizeAvailableCompilerPreference('system', unavailable)).toEqual({
      preference: 'auto',
      fellBack: true,
    });
    expect(normalizeAvailableCompilerPreference('tectonic', unavailable)).toEqual({
      preference: 'tectonic',
      fellBack: false,
    });
  });

  it('shows the actual provider selected by each preference', () => {
    expect(resolvePreferredProviderLabel('auto', capabilities)).toBe('latexmk + XeLaTeX');
    expect(resolvePreferredProviderLabel('system', capabilities)).toBe('latexmk + XeLaTeX');
    expect(resolvePreferredProviderLabel('tectonic', capabilities)).toBe('Tectonic');
  });
});
