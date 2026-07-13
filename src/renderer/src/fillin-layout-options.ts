import {
  buildEffectiveFillinOptions,
  type BlankSlot,
  type ExamDocument,
  type ExamZhOptionBag,
  type ExamZhOptionValue,
} from '../../shared/document';
import type { BlankSlotType, FillinSetup } from '../../shared/document/model';

export const fillinCounterLabelPresets = [
  { id: 'arabic', label: '数字（1、2、3）', value: '\\arabic*' },
  { id: 'alph', label: '小写字母（a、b、c）', value: '\\alph*' },
  { id: 'Alph', label: '大写字母（A、B、C）', value: '\\Alph*' },
  { id: 'roman', label: '小写罗马数字（i、ii、iii）', value: '\\roman*' },
  { id: 'Roman', label: '大写罗马数字（I、II、III）', value: '\\Roman*' },
  { id: 'circlednumber', label: '带圈数字（字符）', value: '\\circlednumber*' },
  { id: 'tikzcirclednumber', label: '带圈数字（绘制）', value: '\\tikzcirclednumber*' },
] as const;

export type FillinNoAnswerType = NonNullable<BlankSlot['noAnswerType']>;
export type FillinNoAnswerSelection = FillinNoAnswerType | 'inherit' | 'custom';
export type FillinColorSelection = 'black' | 'red' | 'custom';
export type FillinParenSelection = NonNullable<BlankSlot['parenType']> | 'inherit' | 'custom';
export type FillinWidthSelection = NonNullable<BlankSlot['widthType']> | 'inherit' | 'custom';
export type FillinCounterLabelPresetId = (typeof fillinCounterLabelPresets)[number]['id'];
export type FillinCounterLabelSelection = FillinCounterLabelPresetId | 'custom';

export interface ResolvedFillinLayout {
  command: NonNullable<BlankSlot['command']>;
  type: BlankSlotType;
  width: string;
  showAnswer: boolean;
  noAnswerType: FillinNoAnswerType;
  widthType: NonNullable<BlankSlot['widthType']>;
  parenType: NonNullable<BlankSlot['parenType']>;
  boxColor: string;
  textColor: string;
  counterIndex: number;
  counterLabel: string;
  localCounterIndex?: number;
}

export interface FillinCounterPreviewState {
  next: number;
}

type ManagedFillinOptionKey =
  | 'no-answer-type'
  | 'no-answer-counter-index'
  | 'no-answer-counter-label'
  | 'text-color'
  | 'box-color'
  | 'paren-type'
  | 'width-type';

const defaultNoAnswerType: FillinNoAnswerType = 'blacktriangle';
const defaultCounterIndex = 1;
const defaultCounterLabel = '\\arabic*';
const defaultColor = 'black';
const defaultParenType: NonNullable<BlankSlot['parenType']> = 'banjiao';
const defaultWidthType: NonNullable<BlankSlot['widthType']> = 'normal';

export function getGlobalFillinNoAnswerSelection(
  document: Pick<ExamDocument, 'setup'>,
): Exclude<FillinNoAnswerSelection, 'inherit'> {
  const value = getEffectiveGlobalFillinOptions(document)['no-answer-type'];
  return isNoAnswerType(value) ? value : value === undefined ? defaultNoAnswerType : 'custom';
}

export function getBlankFillinNoAnswerSelection(blank: BlankSlot): FillinNoAnswerSelection {
  const options = getLocalBlankFillinOptions(blank);
  if (!Object.hasOwn(options, 'no-answer-type')) {
    return 'inherit';
  }

  return isNoAnswerType(options['no-answer-type']) ? options['no-answer-type'] : 'custom';
}

export function getGlobalFillinTextColorSelection(
  document: Pick<ExamDocument, 'setup'>,
): FillinColorSelection {
  const teacherSetup = { ...document.setup, answerMode: 'teacher' as const };
  return getColorSelection(buildEffectiveFillinOptions({ setup: teacherSetup })['text-color']);
}

export function getGlobalFillinBoxColorSelection(
  document: Pick<ExamDocument, 'setup'>,
): FillinColorSelection {
  return getColorSelection(getEffectiveGlobalFillinOptions(document)['box-color']);
}

export function getGlobalFillinParenSelection(
  document: Pick<ExamDocument, 'setup'>,
): Exclude<FillinParenSelection, 'inherit'> {
  const value = getEffectiveGlobalFillinOptions(document)['paren-type'];
  return isParenType(value) ? value : value === undefined ? defaultParenType : 'custom';
}

export function getBlankFillinParenSelection(blank: BlankSlot): FillinParenSelection {
  const options = getLocalBlankFillinOptions(blank);
  if (!Object.hasOwn(options, 'paren-type')) {
    return 'inherit';
  }

  return isParenType(options['paren-type']) ? options['paren-type'] : 'custom';
}

export function getGlobalFillinWidthSelection(
  document: Pick<ExamDocument, 'setup'>,
): Exclude<FillinWidthSelection, 'inherit'> {
  const value = getEffectiveGlobalFillinOptions(document)['width-type'];
  return isWidthType(value) ? value : value === undefined ? defaultWidthType : 'custom';
}

export function getBlankFillinWidthSelection(blank: BlankSlot): FillinWidthSelection {
  const options = getLocalBlankFillinOptions(blank);
  if (!Object.hasOwn(options, 'width-type')) {
    return 'inherit';
  }

  return isWidthType(options['width-type']) ? options['width-type'] : 'custom';
}

export function getGlobalFillinCounterLabelSelection(
  document: Pick<ExamDocument, 'setup'>,
): FillinCounterLabelSelection {
  const value = getEffectiveGlobalFillinOptions(document)['no-answer-counter-label'];
  return getFillinCounterLabelPresetId(value) ?? (value === undefined ? 'arabic' : 'custom');
}

export function getGlobalFillinCounterIndex(
  document: Pick<ExamDocument, 'setup'>,
): number | undefined {
  const value = getEffectiveGlobalFillinOptions(document)['no-answer-counter-index'];
  return value === undefined ? defaultCounterIndex : toPositiveInteger(value);
}

export function hasGlobalFillinAdvancedOverrides(document: Pick<ExamDocument, 'setup'>): boolean {
  const options = getEffectiveGlobalFillinOptions(document);
  return ['box-color', 'paren-type', 'width-type'].some((key) => Object.hasOwn(options, key));
}

export function setGlobalFillinNoAnswerType(
  document: ExamDocument,
  selection: Exclude<FillinNoAnswerSelection, 'inherit' | 'custom'>,
): ExamDocument {
  const cleared = removeManagedGlobalFillinOption(document, 'no-answer-type');
  return selection === defaultNoAnswerType
    ? cleared
    : setCanonicalGlobalFillinOption(cleared, 'no-answer-type', selection);
}

export function setGlobalFillinTextColor(
  document: ExamDocument,
  selection: Exclude<FillinColorSelection, 'custom'>,
): ExamDocument {
  const cleared = removeManagedGlobalFillinOption(document, 'text-color');
  const setup = { ...cleared.setup };
  const fillin = setup.fillin ? { ...setup.fillin } : {};

  if (selection === 'red') {
    fillin.answerColor = 'red';
  } else {
    delete fillin.answerColor;
  }

  if (isEmptyFillinSetup(fillin)) {
    delete setup.fillin;
  } else {
    setup.fillin = fillin;
  }

  return { ...cleared, setup };
}

export function setGlobalFillinBoxColor(
  document: ExamDocument,
  selection: Exclude<FillinColorSelection, 'custom'>,
): ExamDocument {
  const cleared = removeManagedGlobalFillinOption(document, 'box-color');
  return selection === defaultColor
    ? cleared
    : setCanonicalGlobalFillinOption(cleared, 'box-color', selection);
}

export function setGlobalFillinParenType(
  document: ExamDocument,
  selection: Exclude<FillinParenSelection, 'inherit' | 'custom'>,
): ExamDocument {
  const cleared = removeManagedGlobalFillinOption(document, 'paren-type');
  return selection === defaultParenType
    ? cleared
    : setCanonicalGlobalFillinOption(cleared, 'paren-type', selection);
}

export function setGlobalFillinWidthType(
  document: ExamDocument,
  selection: Exclude<FillinWidthSelection, 'inherit' | 'custom'>,
): ExamDocument {
  const cleared = removeManagedGlobalFillinOption(document, 'width-type');
  return selection === defaultWidthType
    ? cleared
    : setCanonicalGlobalFillinOption(cleared, 'width-type', selection);
}

export function setGlobalFillinCounterLabel(
  document: ExamDocument,
  presetId: FillinCounterLabelPresetId,
): ExamDocument {
  const cleared = removeManagedGlobalFillinOption(document, 'no-answer-counter-label');
  const value = getFillinCounterLabelPresetValue(presetId);
  return value === defaultCounterLabel
    ? cleared
    : setCanonicalGlobalFillinOption(cleared, 'no-answer-counter-label', value);
}

export function setGlobalFillinCounterIndex(document: ExamDocument, value: number): ExamDocument {
  const cleared = removeManagedGlobalFillinOption(document, 'no-answer-counter-index');
  const normalized = Math.max(1, Math.floor(value));
  return normalized === defaultCounterIndex
    ? cleared
    : setCanonicalGlobalFillinOption(cleared, 'no-answer-counter-index', normalized);
}

export function setBlankFillinNoAnswerType(
  blank: BlankSlot,
  selection: Exclude<FillinNoAnswerSelection, 'custom'>,
): BlankSlot {
  const next = removeManagedBlankFillinOption(blank, 'no-answer-type');
  if (selection === 'inherit') {
    delete next.noAnswerType;
  } else {
    next.noAnswerType = selection;
  }
  return next;
}

export function setBlankFillinParenType(
  blank: BlankSlot,
  selection: Exclude<FillinParenSelection, 'custom'>,
): BlankSlot {
  const next = removeManagedBlankFillinOption(blank, 'paren-type');
  if (selection === 'inherit') {
    delete next.parenType;
  } else {
    next.parenType = selection;
  }
  return next;
}

export function setBlankFillinWidthType(
  blank: BlankSlot,
  selection: Exclude<FillinWidthSelection, 'custom'>,
): BlankSlot {
  const next = removeManagedBlankFillinOption(blank, 'width-type');
  if (selection === 'inherit') {
    delete next.widthType;
  } else {
    next.widthType = selection;
  }
  return next;
}

export function resolveFillinLayout(
  document: Pick<ExamDocument, 'setup' | 'examZh'>,
  blank?: BlankSlot,
): ResolvedFillinLayout {
  const options = buildEffectiveFillinOptions(document, blank);
  const localOptions = blank ? getLocalBlankFillinOptions(blank) : {};

  return {
    command: blank?.command ?? 'fillin',
    type: isBlankType(options.type) ? options.type : 'line',
    width: typeof options.width === 'string' ? options.width : '3em',
    showAnswer: options['show-answer'] === true,
    noAnswerType: isNoAnswerType(options['no-answer-type'])
      ? options['no-answer-type']
      : defaultNoAnswerType,
    widthType: isWidthType(options['width-type']) ? options['width-type'] : defaultWidthType,
    parenType: isParenType(options['paren-type']) ? options['paren-type'] : defaultParenType,
    boxColor: getStringOption(options['box-color'], defaultColor),
    textColor: getStringOption(options['text-color'], defaultColor),
    counterIndex: toPositiveInteger(options['no-answer-counter-index']) ?? defaultCounterIndex,
    counterLabel: getStringOption(options['no-answer-counter-label'], defaultCounterLabel),
    localCounterIndex: toPositiveInteger(localOptions['no-answer-counter-index']),
  };
}

export function getFillinCounterExample(label: string, index: number, count = 3): string {
  const preset = getFillinCounterLabelPresetId(label);
  if (!preset) {
    return `从 ${index} 开始；最终标签以 PDF 为准`;
  }

  const labels = Array.from({ length: count }, (_, offset) =>
    formatFillinCounterLabel(label, index + offset),
  );
  return `从 ${index} 开始：${labels.join('、')}`;
}

export function getFillinCounterRangeWarning(
  label: string,
  index: number,
  count = 3,
): string | undefined {
  const preset = getFillinCounterLabelPresetId(label);
  const lastIndex = index + Math.max(1, count) - 1;

  if ((preset === 'alph' || preset === 'Alph') && lastIndex > 26) {
    return '当前字母标签会超过 26；请降低首个编号值或改用数字/罗马数字。';
  }

  if (preset === 'circlednumber' && lastIndex > 50) {
    return 'exam-zh 字符带圈数字只支持到 50；请降低首个编号值或改用其他样式。';
  }

  return undefined;
}

export function formatFillinCounterLabel(label: string, number: number): string {
  switch (getFillinCounterLabelPresetId(label)) {
    case 'arabic':
      return String(number);
    case 'alph':
      return formatAlphabetic(number, false);
    case 'Alph':
      return formatAlphabetic(number, true);
    case 'roman':
      return formatRoman(number).toLowerCase();
    case 'Roman':
      return formatRoman(number);
    case 'circlednumber':
    case 'tikzcirclednumber':
      return formatCircledNumber(number);
    case null:
      return String(number);
  }
}

export function consumeFillinCounterPreviewLabel(
  layout: ResolvedFillinLayout,
  state: FillinCounterPreviewState,
): string | undefined {
  if (layout.localCounterIndex !== undefined) {
    state.next = layout.localCounterIndex;
  }

  if (layout.showAnswer || layout.noAnswerType !== 'counter') {
    return undefined;
  }

  const label = formatFillinCounterLabel(layout.counterLabel, state.next);
  state.next += 1;
  return label;
}

export function getEffectiveGlobalFillinOptions(
  document: Pick<ExamDocument, 'setup'>,
): ExamZhOptionBag {
  return buildEffectiveFillinOptions(document);
}

function getFillinCounterLabelPresetId(
  value: ExamZhOptionValue | undefined,
): FillinCounterLabelPresetId | null {
  if (typeof value !== 'string') {
    return null;
  }

  return fillinCounterLabelPresets.find((preset) => preset.value === value.trim())?.id ?? null;
}

function getFillinCounterLabelPresetValue(presetId: FillinCounterLabelPresetId): string {
  return (
    fillinCounterLabelPresets.find((preset) => preset.id === presetId)?.value ?? defaultCounterLabel
  );
}

function getLocalBlankFillinOptions(blank: BlankSlot): ExamZhOptionBag {
  const options = extractLocalFillinOptions(blank.examZhOptions);

  if (blank.noAnswerType !== undefined) {
    options['no-answer-type'] = blank.noAnswerType;
  }
  if (blank.widthType !== undefined) {
    options['width-type'] = blank.widthType;
  }
  if (blank.parenType !== undefined) {
    options['paren-type'] = blank.parenType;
  }

  return options;
}

function extractLocalFillinOptions(options: ExamZhOptionBag | undefined): ExamZhOptionBag {
  if (!options) {
    return {};
  }

  const scoped: ExamZhOptionBag = {};
  const nested = options.fillin;
  if (isOptionBag(nested)) {
    Object.assign(scoped, nested);
  }

  for (const [key, value] of Object.entries(options)) {
    if (key.startsWith('fillin/')) {
      scoped[key.slice('fillin/'.length)] = value;
    } else if (key !== 'fillin') {
      scoped[key] = value;
    }
  }

  return scoped;
}

function removeManagedGlobalFillinOption(
  document: ExamDocument,
  key: ManagedFillinOptionKey,
): ExamDocument {
  const setup = { ...document.setup };
  const fillin = setup.fillin ? { ...setup.fillin } : undefined;

  if (fillin) {
    const options = removeFillinOptionFromBag(fillin.examZhOptions, key, true);
    if (options) {
      fillin.examZhOptions = options;
    } else {
      delete fillin.examZhOptions;
    }

    if (isEmptyFillinSetup(fillin)) {
      delete setup.fillin;
    } else {
      setup.fillin = fillin;
    }
  }

  const setupOptions = removeFillinOptionFromBag(setup.examZhOptions, key, false);
  if (setupOptions) {
    setup.examZhOptions = setupOptions;
  } else {
    delete setup.examZhOptions;
  }

  return { ...document, setup };
}

function setCanonicalGlobalFillinOption(
  document: ExamDocument,
  key: ManagedFillinOptionKey,
  value: ExamZhOptionValue,
): ExamDocument {
  const fillin = document.setup.fillin ?? {};
  return {
    ...document,
    setup: {
      ...document.setup,
      fillin: {
        ...fillin,
        examZhOptions: { ...(fillin.examZhOptions ?? {}), [key]: value },
      },
    },
  };
}

function removeManagedBlankFillinOption(blank: BlankSlot, key: ManagedFillinOptionKey): BlankSlot {
  const next = { ...blank };
  const options = removeFillinOptionFromBag(next.examZhOptions, key, true);
  if (options) {
    next.examZhOptions = options;
  } else {
    delete next.examZhOptions;
  }
  return next;
}

function removeFillinOptionFromBag(
  options: ExamZhOptionBag | undefined,
  key: ManagedFillinOptionKey,
  includeLocalKey: boolean,
): ExamZhOptionBag | undefined {
  if (!options) {
    return undefined;
  }

  const next: ExamZhOptionBag = { ...options };
  if (includeLocalKey) {
    delete next[key];
  }
  delete next[`fillin/${key}`];

  if (isOptionBag(next.fillin)) {
    const nested = { ...next.fillin };
    delete nested[key];
    if (Object.keys(nested).length === 0) {
      delete next.fillin;
    } else {
      next.fillin = nested;
    }
  }

  return Object.keys(next).length > 0 ? next : undefined;
}

function isEmptyFillinSetup(fillin: FillinSetup): boolean {
  return (
    fillin.type === undefined &&
    fillin.width === undefined &&
    fillin.answerColor === undefined &&
    (!fillin.examZhOptions || Object.keys(fillin.examZhOptions).length === 0)
  );
}

function isNoAnswerType(value: ExamZhOptionValue | undefined): value is FillinNoAnswerType {
  return value === 'blacktriangle' || value === 'counter' || value === 'none';
}

function isParenType(
  value: ExamZhOptionValue | undefined,
): value is NonNullable<BlankSlot['parenType']> {
  return value === 'banjiao' || value === 'quanjiao';
}

function isWidthType(
  value: ExamZhOptionValue | undefined,
): value is NonNullable<BlankSlot['widthType']> {
  return value === 'normal' || value === 'fill';
}

function isBlankType(value: ExamZhOptionValue | undefined): value is BlankSlotType {
  return (
    value === 'line' ||
    value === 'paren' ||
    value === 'circle' ||
    value === 'rectangle' ||
    value === 'blank'
  );
}

function getColorSelection(value: ExamZhOptionValue | undefined): FillinColorSelection {
  if (value === undefined || value === 'black') {
    return 'black';
  }
  return value === 'red' ? 'red' : 'custom';
}

function getStringOption(value: ExamZhOptionValue | undefined, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function toPositiveInteger(value: ExamZhOptionValue | undefined): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === 'string' && /^\d+$/u.test(value.trim())) {
    const parsed = Number(value);
    return parsed > 0 ? parsed : undefined;
  }
  return undefined;
}

function isOptionBag(value: ExamZhOptionValue | undefined): value is ExamZhOptionBag {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatAlphabetic(number: number, uppercase: boolean): string {
  if (number < 1 || number > 26) {
    return String(number);
  }
  return String.fromCharCode((uppercase ? 65 : 97) + number - 1);
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
  if (number >= 21 && number <= 35) {
    return String.fromCodePoint(0x3251 + number - 21);
  }
  if (number >= 36 && number <= 50) {
    return String.fromCodePoint(0x32b1 + number - 36);
  }
  return String(number);
}
