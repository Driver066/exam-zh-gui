import type { ExamDocument, ExamQuestion, ExamSection, NumberingSetup } from './model';

export const DEFAULT_QUESTION_LABEL = '\\arabic*.';

export const questionLabelPresets = [
  { id: 'arabic', label: '默认（1.）', value: DEFAULT_QUESTION_LABEL },
  { id: 'alph', label: '小写字母（a.）', value: '\\alph*.' },
  { id: 'Alph', label: '大写字母（A.）', value: '\\Alph*.' },
  { id: 'roman', label: '小写罗马数字（i.）', value: '\\roman*.' },
  { id: 'Roman', label: '大写罗马数字（I.）', value: '\\Roman*.' },
  { id: 'circlednumber', label: '带圈数字（字符）', value: '\\circlednumber*' },
  { id: 'tikzcirclednumber', label: '带圈数字（绘制）', value: '\\tikzcirclednumber*' },
] as const;

export type QuestionLabelPresetId = (typeof questionLabelPresets)[number]['id'];
export type QuestionLabelPresetSelection = QuestionLabelPresetId | 'custom';
export type SectionNumberingMode = 'continue' | 'restart' | 'customStart';

export interface ResolvedQuestionNumber {
  number: number;
  label: string;
  preset: QuestionLabelPresetSelection;
}

export function getSectionNumberingMode(
  numbering: NumberingSetup | undefined,
): SectionNumberingMode {
  if (numbering?.start !== undefined) {
    return 'customStart';
  }

  return numbering?.reset ? 'restart' : 'continue';
}

export function getSectionStartIndex(section: ExamSection): number | undefined {
  if (section.numbering?.start !== undefined) {
    return section.numbering.start;
  }

  return section.numbering?.reset ? 1 : undefined;
}

export function getSectionQuestionLabel(section: ExamSection): string {
  const label = section.numbering?.examZhOptions?.label;
  return typeof label === 'string' && label.trim().length > 0
    ? label.trim()
    : DEFAULT_QUESTION_LABEL;
}

export function getQuestionLabelPreset(label: string | undefined): QuestionLabelPresetSelection {
  const normalized = label?.trim() || DEFAULT_QUESTION_LABEL;
  return questionLabelPresets.find((preset) => preset.value === normalized)?.id ?? 'custom';
}

export function getQuestionLabelPresetValue(presetId: QuestionLabelPresetId): string | undefined {
  if (presetId === 'arabic') {
    return undefined;
  }

  return questionLabelPresets.find((preset) => preset.id === presetId)?.value;
}

export function resolveQuestionNumbers(
  document: Pick<ExamDocument, 'sections'>,
): Map<string, ResolvedQuestionNumber> {
  const resolved = new Map<string, ResolvedQuestionNumber>();
  let nextQuestionNumber = 1;

  for (const section of document.sections) {
    const sectionStart = getSectionStartIndex(section);
    let sectionStartPending = sectionStart !== undefined;
    const sectionLabel = getSectionQuestionLabel(section);

    for (const question of section.questions) {
      if (!isStructuredQuestion(question)) {
        continue;
      }

      if (sectionStartPending) {
        nextQuestionNumber = sectionStart ?? nextQuestionNumber;
        sectionStartPending = false;
      }

      const explicitIndex = getQuestionIndexOverride(question);
      const number = explicitIndex ?? nextQuestionNumber;
      const explicitLabel = question.examZhOptions?.label;
      const label =
        typeof explicitLabel === 'string' && explicitLabel.trim().length > 0
          ? explicitLabel.trim()
          : sectionLabel;

      resolved.set(question.id, {
        number,
        label: formatQuestionLabel(number, label),
        preset: getQuestionLabelPreset(label),
      });
      nextQuestionNumber = number + 1;
    }
  }

  return resolved;
}

export function formatQuestionLabel(number: number, label: string): string {
  switch (getQuestionLabelPreset(label)) {
    case 'arabic':
      return `${number}.`;
    case 'alph':
      return `${formatAlphabetic(number, false)}.`;
    case 'Alph':
      return `${formatAlphabetic(number, true)}.`;
    case 'roman':
      return `${formatRoman(number).toLowerCase()}.`;
    case 'Roman':
      return `${formatRoman(number)}.`;
    case 'circlednumber':
    case 'tikzcirclednumber':
      return formatCircledNumber(number);
    case 'custom':
      return `${number}.`;
  }
}

function isStructuredQuestion(question: ExamQuestion): boolean {
  return question.type !== 'rawLatex' || !question.rawLatex;
}

function getQuestionIndexOverride(question: ExamQuestion): number | undefined {
  const rawIndex = question.examZhOptions?.index;

  if (typeof rawIndex === 'number' && Number.isInteger(rawIndex) && rawIndex > 0) {
    return rawIndex;
  }

  if (typeof rawIndex === 'string' && /^\d+$/u.test(rawIndex.trim())) {
    const parsed = Number(rawIndex);
    return parsed > 0 ? parsed : question.index;
  }

  return question.index;
}

function formatAlphabetic(number: number, uppercase: boolean): string {
  if (number < 1 || number > 26) {
    return String(number);
  }

  const base = uppercase ? 65 : 97;
  return String.fromCharCode(base + number - 1);
}

function formatRoman(number: number): string {
  if (number < 1 || number > 3999) {
    return String(number);
  }

  const parts: Array<[number, string]> = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let remaining = number;
  let result = '';

  for (const [value, numeral] of parts) {
    while (remaining >= value) {
      result += numeral;
      remaining -= value;
    }
  }

  return result;
}

function formatCircledNumber(number: number): string {
  if (number >= 1 && number <= 20) {
    return String.fromCodePoint(0x2460 + number - 1);
  }

  return String(number);
}
