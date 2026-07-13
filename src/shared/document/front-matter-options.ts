import type {
  FrontMatterSpacing,
  InformationSeparatorMode,
  InformationSeparatorSetup,
} from './model';

export const informationSpacingPresets = {
  compact: { top: '.25em', bottom: '.25em' },
  moderate: { top: '.75em', bottom: '.5em' },
  loose: { top: '1.25em', bottom: '.75em' },
} as const satisfies Record<string, FrontMatterSpacing>;

export const warningSpacingPresets = {
  compact: { top: '.25em', bottom: '.25em' },
  moderate: { top: '.5em', bottom: '.5em' },
  loose: { top: '1em', bottom: '.75em' },
} as const satisfies Record<string, FrontMatterSpacing>;

export type FrontMatterSpacingPresetId =
  'default' | keyof typeof informationSpacingPresets | 'custom';

export const informationSeparatorModes: readonly InformationSeparatorMode[] = [
  'compactSpace',
  'wideSpace',
  'comma',
  'middleDot',
  'verticalBar',
  'none',
  'custom',
];

const dimensionPattern = '[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:pt|em|ex|mm|cm|in|bp)';
const skipPattern = new RegExp(
  `^${dimensionPattern}(?:\\s+plus\\s+${dimensionPattern})?(?:\\s+minus\\s+${dimensionPattern})?$`,
);

export function validateLatexSkip(value: string): string | null {
  const normalized = value.trim();
  if (!normalized) return '间距不能为空。';
  if (!skipPattern.test(normalized)) {
    return '请输入带单位的长度，可选 plus / minus 弹性长度。';
  }
  return null;
}

export function normalizeFrontMatterSpacing(
  spacing: FrontMatterSpacing | undefined,
): FrontMatterSpacing | undefined {
  if (!spacing) return undefined;
  const top = spacing.top.trim();
  const bottom = spacing.bottom.trim();
  return top && bottom ? { top, bottom } : undefined;
}

export function validateInformationSeparatorText(value: string): string | null {
  const normalized = value.trim();
  if (!normalized) return '自定义分隔符不能为空。';
  if (/\r|\n/.test(value)) return '自定义分隔符不能换行。';
  if ([...normalized].length > 8) return '自定义分隔符最多 8 个字符。';
  return null;
}

export function normalizeInformationSeparator(
  separator: InformationSeparatorSetup | undefined,
): InformationSeparatorSetup | undefined {
  if (!separator) return undefined;
  if (separator.mode !== 'custom') return { mode: separator.mode };
  const text = separator.text?.trim();
  return text ? { mode: 'custom', text } : undefined;
}

export function matchSpacingPreset(
  spacing: FrontMatterSpacing | undefined,
  presets: Record<string, FrontMatterSpacing>,
): string | null {
  if (!spacing) return 'default';
  for (const [id, preset] of Object.entries(presets)) {
    if (spacing.top === preset.top && spacing.bottom === preset.bottom) return id;
  }
  return 'custom';
}
