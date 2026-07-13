import type { BlankSlot, BlankSlotType } from '../../shared/document/model';

export type BlankLengthPresetId = 'short' | 'medium' | 'long' | 'custom';

export interface BlankLengthPreset {
  id: BlankLengthPresetId;
  label: string;
  description: string;
  command?: BlankSlot['command'];
  width?: string;
}

export interface BlankStyleOption {
  type: BlankSlotType;
  label: string;
  description: string;
}

export const blankLengthPresets: BlankLengthPreset[] = [
  {
    id: 'short',
    label: '短填空',
    description: '约 3 个汉字宽，适合数字、单词或短表达式。',
    command: 'fillin',
    width: '3em',
  },
  {
    id: 'medium',
    label: '中等填空',
    description: '约 6 个汉字宽，适合稍长的短语或代数式。',
    command: 'fillin',
    width: '6em',
  },
  {
    id: 'long',
    label: '长留空，学生版可换行',
    description: '约 10 个汉字宽；主要用于学生版不显示答案时的可换行留空。',
    command: 'fillin*',
    width: '10em',
  },
  {
    id: 'custom',
    label: '自定义',
    description: '手动设置 LaTeX 填空命令和长度。',
  },
];

export const blankStyleOptions: BlankStyleOption[] = [
  {
    type: 'line',
    label: '横线',
    description: '最常见的填空横线，适合多数数学和理科填空。',
  },
  {
    type: 'paren',
    label: '括号',
    description: '适合选择式、判断式或需要括号占位的填空。',
  },
  {
    type: 'rectangle',
    label: '方框',
    description: '适合强调答案框或需要明显答案区域的场景。',
  },
  {
    type: 'circle',
    label: '圆圈',
    description: '适合短答案标记；内容变长时可能被拉伸成椭圆。',
  },
  {
    type: 'blank',
    label: '空白',
    description: '只保留空间，不画线或框。',
  },
];

export function getBlankLengthPreset(blank: BlankSlot): BlankLengthPresetId {
  const command = blank.command ?? 'fillin';
  const width = normalizeBlankWidth(blank.width);

  if (command === 'fillin' && (width === undefined || width === '3em')) {
    return 'short';
  }

  if (command === 'fillin' && width === '6em') {
    return 'medium';
  }

  if (command === 'fillin*' && width === '10em') {
    return 'long';
  }

  return 'custom';
}

export function getBlankLengthPresetById(id: BlankLengthPresetId): BlankLengthPreset {
  return blankLengthPresets.find((preset) => preset.id === id) ?? blankLengthPresets[0]!;
}

export function applyBlankLengthPreset(blank: BlankSlot, id: BlankLengthPresetId): BlankSlot {
  const preset = getBlankLengthPresetById(id);

  if (preset.id === 'custom') {
    return blank;
  }

  return {
    ...blank,
    command: preset.command,
    width: preset.width,
  };
}

export function getBlankStyleOption(type: BlankSlotType | undefined): BlankStyleOption {
  const normalizedType = type ?? 'line';
  return (
    blankStyleOptions.find((option) => option.type === normalizedType) ?? blankStyleOptions[0]!
  );
}

function normalizeBlankWidth(width: string | undefined): string | undefined {
  const trimmed = width?.replace(/\s+/gu, '') ?? '';
  return trimmed === '' ? undefined : trimmed;
}
