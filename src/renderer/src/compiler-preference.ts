import type {
  CompilerCapabilities,
  CompilerPreference,
  CompilerProviderId,
} from '../../shared/compile/types';

export const compilerPreferenceStorageKey = 'exam-zh-gui.compiler';

export function normalizeCompilerPreference(value: unknown): CompilerPreference | null {
  return value === 'auto' || value === 'tectonic' || value === 'system' ? value : null;
}

export function readCompilerPreference(storage: Pick<Storage, 'getItem'>): CompilerPreference {
  return normalizeCompilerPreference(storage.getItem(compilerPreferenceStorageKey)) ?? 'auto';
}

export function writeCompilerPreference(
  storage: Pick<Storage, 'setItem'>,
  preference: CompilerPreference,
): void {
  storage.setItem(compilerPreferenceStorageKey, preference);
}

export function normalizeAvailableCompilerPreference(
  preference: CompilerPreference,
  capabilities: CompilerCapabilities | null,
): { preference: CompilerPreference; fellBack: boolean } {
  if (preference !== 'system' || capabilities?.systemProvider) {
    return { preference, fellBack: false };
  }
  return { preference: 'auto', fellBack: true };
}

export function resolvePreferredProviderLabel(
  preference: CompilerPreference,
  capabilities: CompilerCapabilities | null,
): string {
  const providerId =
    preference === 'auto'
      ? capabilities?.automaticProvider
      : preference === 'system'
        ? capabilities?.systemProvider
        : capabilities?.tectonicAvailable
          ? 'tectonic'
          : undefined;
  return getCapabilityLabel(capabilities, providerId) ?? '未检测到可用编译器';
}

function getCapabilityLabel(
  capabilities: CompilerCapabilities | null,
  id: CompilerProviderId | undefined,
): string | undefined {
  return capabilities?.providers.find((provider) => provider.id === id)?.label;
}
