import {
  formatQuestionLabel,
  getChoiceDisplayLabel,
  type ChoiceOption,
  type ChoicesSetup,
  type ExamDocument,
  type ExamQuestion,
  type ExamZhOptionBag,
  type ExamZhOptionValue,
} from '../../shared/document';

export const choiceLabelPresets = [
  { id: 'Alph', label: '大写字母（A.）', value: '\\Alph*.' },
  { id: 'arabic', label: '数字（1.）', value: '\\arabic*.' },
  { id: 'alph', label: '小写字母（a.）', value: '\\alph*.' },
  { id: 'roman', label: '小写罗马数字（i.）', value: '\\roman*.' },
  { id: 'Roman', label: '大写罗马数字（I.）', value: '\\Roman*.' },
  { id: 'circlednumber', label: '带圈数字（①）', value: '\\circlednumber*' },
] as const;

export const choiceLabelPositionOptions = [
  { id: 'auto', label: '自动' },
  { id: 'top-left', label: '左上' },
  { id: 'left', label: '左侧居中' },
  { id: 'bottom', label: '底部' },
] as const;

export const choiceHorizontalDensityPresets = [
  {
    id: 'upstream',
    label: '上游默认',
    values: { columnSep: '1em', labelSep: '.5em' },
  },
  {
    id: 'compact',
    label: '紧凑',
    values: { columnSep: '.5em', labelSep: '.25em' },
  },
  {
    id: 'loose',
    label: '宽松',
    values: { columnSep: '1.5em', labelSep: '.75em' },
  },
] as const;

export const choiceVerticalSpacingPresets = [
  {
    id: 'upstream',
    label: '上游默认',
    values: { topSep: '0pt', bottomSep: '0pt', lineSep: '0pt plus .5ex' },
  },
  {
    id: 'moderate',
    label: '适中',
    values: { topSep: '.25em', bottomSep: '.25em', lineSep: '.25em plus .15em' },
  },
  {
    id: 'loose',
    label: '宽松',
    values: { topSep: '.5em', bottomSep: '.5em', lineSep: '.5em plus .25em' },
  },
] as const;

export const choiceLabelWidthPresets = [
  { id: 'auto', label: '自动测量', value: '0pt' },
  { id: 'standard', label: '标准预留', value: '1.5em' },
  { id: 'wide', label: '宽预留', value: '2em' },
] as const;

export const choiceLabelAlignmentOptions = [
  { id: 'left', label: '左对齐' },
  { id: 'center', label: '居中' },
  { id: 'right', label: '右对齐' },
] as const;

export type ChoiceLabelPresetId = (typeof choiceLabelPresets)[number]['id'];
export type ChoiceLabelSelection = ChoiceLabelPresetId | 'inherit' | 'custom';
export type ChoiceLabelPosition = (typeof choiceLabelPositionOptions)[number]['id'];
export type ChoiceLabelPositionSelection = ChoiceLabelPosition | 'inherit' | 'custom';
export type ChoiceHorizontalDensityPresetId = (typeof choiceHorizontalDensityPresets)[number]['id'];
export type ChoiceHorizontalDensitySelection =
  ChoiceHorizontalDensityPresetId | 'inherit' | 'custom';
export type ChoiceVerticalSpacingPresetId = (typeof choiceVerticalSpacingPresets)[number]['id'];
export type ChoiceVerticalSpacingSelection = ChoiceVerticalSpacingPresetId | 'inherit' | 'custom';
export type ChoiceLabelWidthPresetId = (typeof choiceLabelWidthPresets)[number]['id'];
export type ChoiceLabelWidthSelection = ChoiceLabelWidthPresetId | 'inherit' | 'custom';
export type ChoiceLabelAlignment = (typeof choiceLabelAlignmentOptions)[number]['id'];
export type ChoiceLabelAlignmentSelection = ChoiceLabelAlignment | 'inherit' | 'custom';
export type ChoiceIndexSelection = 'inherit' | 'specified' | 'custom';
export type ChoiceArrangementSelection =
  | 'inherit'
  | 'auto-4'
  | 'auto-2'
  | 'auto-1'
  | 'fixed-1'
  | 'fixed-2'
  | 'fixed-3'
  | 'fixed-4'
  | 'custom';

export type ChoiceArrangementMode = 'inherit' | 'auto' | 'fixed' | 'custom';

export interface ResolvedChoiceLayout {
  columns?: number;
  maxColumns: number;
  label: string;
  labelPosition: ChoiceLabelPosition;
  columnSep: string;
  labelSep: string;
  labelWidth: string;
  labelAlignment: ChoiceLabelAlignment;
  topSep: string;
  bottomSep: string;
  lineSep: string;
  index: number;
  labelSource: 'question-counter' | 'custom-labels' | 'global-counter';
  hasCustomLabels: boolean;
  localCounterActive: boolean;
}

export interface ResolvedGlobalChoiceAdvancedLayout {
  columnSep: string;
  labelSep: string;
  labelWidth: string;
  labelAlignment: ChoiceLabelAlignment;
  topSep: string;
  bottomSep: string;
  lineSep: string;
}

export interface ChoiceHorizontalDensityValues {
  columnSep: string;
  labelSep: string;
}

export interface ChoiceVerticalSpacingValues {
  topSep: string;
  bottomSep: string;
  lineSep: string;
}

type ManagedChoiceOptionKey =
  | 'columns'
  | 'max-columns'
  | 'label'
  | 'label-pos'
  | 'column-sep'
  | 'label-align'
  | 'label-sep'
  | 'label-width'
  | 'top-sep'
  | 'bottom-sep'
  | 'linesep'
  | 'index';

const advancedChoiceOptionKeys = [
  'column-sep',
  'label-align',
  'label-sep',
  'label-width',
  'top-sep',
  'bottom-sep',
  'linesep',
] as const satisfies readonly ManagedChoiceOptionKey[];

const defaultChoiceLabel = '\\Alph*.';
const defaultMaxColumns = 4;
const defaultLabelPosition: ChoiceLabelPosition = 'auto';
const defaultColumnSep = '1em';
const defaultLabelSep = '.5em';
const defaultLabelWidth = '0pt';
const defaultLabelAlignment: ChoiceLabelAlignment = 'left';
const defaultTopSep = '0pt';
const defaultBottomSep = '0pt';
const defaultLineSep = '0pt plus .5ex';

export function getChoiceArrangementMode(
  selection: ChoiceArrangementSelection,
): ChoiceArrangementMode {
  if (selection === 'inherit' || selection === 'custom') {
    return selection;
  }

  return selection.startsWith('fixed-') ? 'fixed' : 'auto';
}

export function getGlobalChoiceArrangementSelection(
  document: ExamDocument,
): ChoiceArrangementSelection {
  return getArrangementSelection(getEffectiveGlobalChoiceOptions(document));
}

export function getQuestionChoiceArrangementSelection(
  question: ExamQuestion,
): ChoiceArrangementSelection {
  const options = getQuestionChoiceOptions(question);

  if (!Object.hasOwn(options, 'columns') && !Object.hasOwn(options, 'max-columns')) {
    return 'inherit';
  }

  return getArrangementSelection(options);
}

export function getGlobalChoiceLabelSelection(document: ExamDocument): ChoiceLabelSelection {
  const value = getEffectiveGlobalChoiceOptions(document).label;

  return getChoiceLabelPresetId(value) ?? (value === undefined ? 'Alph' : 'custom');
}

export function getQuestionChoiceLabelSelection(question: ExamQuestion): ChoiceLabelSelection {
  const options = getQuestionChoiceOptions(question);

  if (!Object.hasOwn(options, 'label')) {
    return 'inherit';
  }

  return getChoiceLabelPresetId(options.label) ?? 'custom';
}

export function getGlobalChoiceLabelPositionSelection(
  document: ExamDocument,
): ChoiceLabelPositionSelection {
  const value = getEffectiveGlobalChoiceOptions(document)['label-pos'];

  return getChoiceLabelPosition(value) ?? (value === undefined ? 'auto' : 'custom');
}

export function getQuestionChoiceLabelPositionSelection(
  question: ExamQuestion,
): ChoiceLabelPositionSelection {
  const options = getQuestionChoiceOptions(question);

  if (!Object.hasOwn(options, 'label-pos')) {
    return 'inherit';
  }

  return getChoiceLabelPosition(options['label-pos']) ?? 'custom';
}

export function getGlobalChoiceHorizontalDensitySelection(
  document: ExamDocument,
): ChoiceHorizontalDensitySelection {
  return getHorizontalDensitySelection(getEffectiveGlobalChoiceOptions(document), 'upstream');
}

export function getQuestionChoiceHorizontalDensitySelection(
  question: ExamQuestion,
): ChoiceHorizontalDensitySelection {
  return getHorizontalDensitySelection(getQuestionChoiceOptions(question), 'inherit');
}

export function getGlobalChoiceVerticalSpacingSelection(
  document: ExamDocument,
): ChoiceVerticalSpacingSelection {
  return getVerticalSpacingSelection(getEffectiveGlobalChoiceOptions(document), 'upstream');
}

export function getQuestionChoiceVerticalSpacingSelection(
  question: ExamQuestion,
): ChoiceVerticalSpacingSelection {
  return getVerticalSpacingSelection(getQuestionChoiceOptions(question), 'inherit');
}

export function getGlobalChoiceLabelWidthSelection(
  document: ExamDocument,
): ChoiceLabelWidthSelection {
  return getLabelWidthSelection(getEffectiveGlobalChoiceOptions(document), 'auto');
}

export function getQuestionChoiceLabelWidthSelection(
  question: ExamQuestion,
): ChoiceLabelWidthSelection {
  return getLabelWidthSelection(getQuestionChoiceOptions(question), 'inherit');
}

export function getGlobalChoiceLabelAlignmentSelection(
  document: ExamDocument,
): ChoiceLabelAlignmentSelection {
  return getLabelAlignmentSelection(getEffectiveGlobalChoiceOptions(document), 'left');
}

export function getQuestionChoiceLabelAlignmentSelection(
  question: ExamQuestion,
): ChoiceLabelAlignmentSelection {
  return getLabelAlignmentSelection(getQuestionChoiceOptions(question), 'inherit');
}

export function getQuestionChoiceIndexSelection(question: ExamQuestion): ChoiceIndexSelection {
  const options = getQuestionChoiceOptions(question);

  if (!Object.hasOwn(options, 'index')) {
    return 'inherit';
  }

  return toPositiveInteger(options.index) === undefined ? 'custom' : 'specified';
}

export function getQuestionChoiceIndexValue(question: ExamQuestion): number | undefined {
  return toPositiveInteger(getQuestionChoiceOptions(question).index);
}

export function setGlobalChoiceArrangement(
  document: ExamDocument,
  selection: Exclude<ChoiceArrangementSelection, 'inherit' | 'custom'>,
): ExamDocument {
  let next = removeManagedGlobalChoiceOption(document, 'columns');
  next = removeManagedGlobalChoiceOption(next, 'max-columns');

  const mode = getChoiceArrangementMode(selection);
  const value = getArrangementValue(selection);

  if (mode === 'fixed') {
    return setCanonicalGlobalChoiceOption(next, 'columns', value);
  }

  if (value !== defaultMaxColumns) {
    return setCanonicalGlobalMaxColumns(next, value);
  }

  return next;
}

export function setQuestionChoiceArrangement(
  question: ExamQuestion,
  selection: Exclude<ChoiceArrangementSelection, 'custom'>,
): ExamQuestion {
  let choicesSetup = removeQuestionChoiceOption(question.choicesSetup, 'columns');
  choicesSetup = removeQuestionChoiceOption(choicesSetup, 'max-columns');

  if (selection === 'inherit') {
    return withQuestionChoicesSetup(question, choicesSetup);
  }

  const mode = getChoiceArrangementMode(selection);
  const value = getArrangementValue(selection);

  if (mode === 'fixed') {
    choicesSetup = setChoicesSetupOption(choicesSetup, 'columns', value);
  } else {
    choicesSetup = { ...(choicesSetup ?? {}), maxColumns: value };
  }

  return withQuestionChoicesSetup(question, choicesSetup);
}

export function setGlobalChoiceLabelPreset(
  document: ExamDocument,
  presetId: ChoiceLabelPresetId,
): ExamDocument {
  const next = removeManagedGlobalChoiceOption(document, 'label');

  if (presetId === 'Alph') {
    return next;
  }

  return setCanonicalGlobalChoiceOption(next, 'label', getChoiceLabelPresetValue(presetId));
}

export function setQuestionChoiceLabelPreset(
  question: ExamQuestion,
  selection: Exclude<ChoiceLabelSelection, 'custom'>,
): ExamQuestion {
  let choicesSetup = removeQuestionChoiceOption(question.choicesSetup, 'label');

  if (selection !== 'inherit') {
    choicesSetup = setChoicesSetupOption(
      choicesSetup,
      'label',
      getChoiceLabelPresetValue(selection),
    );
  }

  return withQuestionChoicesSetup(question, choicesSetup);
}

export function setGlobalChoiceLabelPosition(
  document: ExamDocument,
  position: ChoiceLabelPosition,
): ExamDocument {
  const next = removeManagedGlobalChoiceOption(document, 'label-pos');

  if (position === defaultLabelPosition) {
    return next;
  }

  return setCanonicalGlobalChoiceOption(next, 'label-pos', position);
}

export function setQuestionChoiceLabelPosition(
  question: ExamQuestion,
  selection: Exclude<ChoiceLabelPositionSelection, 'custom'>,
): ExamQuestion {
  let choicesSetup = removeQuestionChoiceOption(question.choicesSetup, 'label-pos');

  if (selection !== 'inherit') {
    choicesSetup = setChoicesSetupOption(choicesSetup, 'label-pos', selection);
  }

  return withQuestionChoicesSetup(question, choicesSetup);
}

export function setGlobalChoiceHorizontalDensity(
  document: ExamDocument,
  selection: ChoiceHorizontalDensityPresetId,
): ExamDocument {
  const cleared = removeManagedGlobalChoiceOptions(document, ['column-sep', 'label-sep']);

  if (selection === 'upstream') {
    return cleared;
  }

  const preset = choiceHorizontalDensityPresets.find((item) => item.id === selection);
  return setGlobalChoiceOptionValues(cleared, {
    'column-sep': preset?.values.columnSep ?? defaultColumnSep,
    'label-sep': preset?.values.labelSep ?? defaultLabelSep,
  });
}

export function setQuestionChoiceHorizontalDensity(
  question: ExamQuestion,
  selection: Exclude<ChoiceHorizontalDensitySelection, 'custom'>,
): ExamQuestion {
  const cleared = removeQuestionChoiceOptions(question.choicesSetup, ['column-sep', 'label-sep']);

  if (selection === 'inherit') {
    return withQuestionChoicesSetup(question, cleared);
  }

  const preset = choiceHorizontalDensityPresets.find((item) => item.id === selection);
  return withQuestionChoicesSetup(
    question,
    setChoicesSetupOptionValues(cleared, {
      'column-sep': preset?.values.columnSep ?? defaultColumnSep,
      'label-sep': preset?.values.labelSep ?? defaultLabelSep,
    }),
  );
}

export function setGlobalChoiceHorizontalDensityCustom(
  document: ExamDocument,
  values: ChoiceHorizontalDensityValues,
): ExamDocument {
  return setGlobalChoiceOptionValues(
    removeManagedGlobalChoiceOptions(document, ['column-sep', 'label-sep']),
    {
      'column-sep': normalizeCustomValue(values.columnSep),
      'label-sep': normalizeCustomValue(values.labelSep),
    },
  );
}

export function setQuestionChoiceHorizontalDensityCustom(
  question: ExamQuestion,
  values: ChoiceHorizontalDensityValues,
): ExamQuestion {
  const cleared = removeQuestionChoiceOptions(question.choicesSetup, ['column-sep', 'label-sep']);
  return withQuestionChoicesSetup(
    question,
    setChoicesSetupOptionValues(cleared, {
      'column-sep': normalizeCustomValue(values.columnSep),
      'label-sep': normalizeCustomValue(values.labelSep),
    }),
  );
}

export function setGlobalChoiceVerticalSpacing(
  document: ExamDocument,
  selection: ChoiceVerticalSpacingPresetId,
): ExamDocument {
  const cleared = removeManagedGlobalChoiceOptions(document, ['top-sep', 'bottom-sep', 'linesep']);

  if (selection === 'upstream') {
    return cleared;
  }

  const preset = choiceVerticalSpacingPresets.find((item) => item.id === selection);
  return setGlobalChoiceOptionValues(cleared, {
    'top-sep': preset?.values.topSep ?? defaultTopSep,
    'bottom-sep': preset?.values.bottomSep ?? defaultBottomSep,
    linesep: preset?.values.lineSep ?? defaultLineSep,
  });
}

export function setQuestionChoiceVerticalSpacing(
  question: ExamQuestion,
  selection: Exclude<ChoiceVerticalSpacingSelection, 'custom'>,
): ExamQuestion {
  const cleared = removeQuestionChoiceOptions(question.choicesSetup, [
    'top-sep',
    'bottom-sep',
    'linesep',
  ]);

  if (selection === 'inherit') {
    return withQuestionChoicesSetup(question, cleared);
  }

  const preset = choiceVerticalSpacingPresets.find((item) => item.id === selection);
  return withQuestionChoicesSetup(
    question,
    setChoicesSetupOptionValues(cleared, {
      'top-sep': preset?.values.topSep ?? defaultTopSep,
      'bottom-sep': preset?.values.bottomSep ?? defaultBottomSep,
      linesep: preset?.values.lineSep ?? defaultLineSep,
    }),
  );
}

export function setGlobalChoiceVerticalSpacingCustom(
  document: ExamDocument,
  values: ChoiceVerticalSpacingValues,
): ExamDocument {
  return setGlobalChoiceOptionValues(
    removeManagedGlobalChoiceOptions(document, ['top-sep', 'bottom-sep', 'linesep']),
    {
      'top-sep': normalizeCustomValue(values.topSep),
      'bottom-sep': normalizeCustomValue(values.bottomSep),
      linesep: normalizeCustomValue(values.lineSep),
    },
  );
}

export function setQuestionChoiceVerticalSpacingCustom(
  question: ExamQuestion,
  values: ChoiceVerticalSpacingValues,
): ExamQuestion {
  const cleared = removeQuestionChoiceOptions(question.choicesSetup, [
    'top-sep',
    'bottom-sep',
    'linesep',
  ]);
  return withQuestionChoicesSetup(
    question,
    setChoicesSetupOptionValues(cleared, {
      'top-sep': normalizeCustomValue(values.topSep),
      'bottom-sep': normalizeCustomValue(values.bottomSep),
      linesep: normalizeCustomValue(values.lineSep),
    }),
  );
}

export function setGlobalChoiceLabelWidth(
  document: ExamDocument,
  selection: ChoiceLabelWidthPresetId,
): ExamDocument {
  const cleared = removeManagedGlobalChoiceOption(document, 'label-width');

  if (selection === 'auto') {
    return cleared;
  }

  return setCanonicalGlobalChoiceOption(cleared, 'label-width', getLabelWidthValue(selection));
}

export function setQuestionChoiceLabelWidth(
  question: ExamQuestion,
  selection: Exclude<ChoiceLabelWidthSelection, 'custom'>,
): ExamQuestion {
  let choicesSetup = removeQuestionChoiceOption(question.choicesSetup, 'label-width');

  if (selection !== 'inherit') {
    choicesSetup = setChoicesSetupOption(
      choicesSetup,
      'label-width',
      getLabelWidthValue(selection),
    );
  }

  return withQuestionChoicesSetup(question, choicesSetup);
}

export function setGlobalChoiceLabelWidthCustom(
  document: ExamDocument,
  value: string,
): ExamDocument {
  return setGlobalChoiceOptionValues(removeManagedGlobalChoiceOption(document, 'label-width'), {
    'label-width': normalizeCustomValue(value),
  });
}

export function setQuestionChoiceLabelWidthCustom(
  question: ExamQuestion,
  value: string,
): ExamQuestion {
  const choicesSetup = setChoicesSetupOptionValues(
    removeQuestionChoiceOption(question.choicesSetup, 'label-width'),
    { 'label-width': normalizeCustomValue(value) },
  );
  return withQuestionChoicesSetup(question, choicesSetup);
}

export function setGlobalChoiceLabelAlignment(
  document: ExamDocument,
  alignment: ChoiceLabelAlignment,
): ExamDocument {
  const cleared = removeManagedGlobalChoiceOption(document, 'label-align');
  return alignment === defaultLabelAlignment
    ? cleared
    : setCanonicalGlobalChoiceOption(cleared, 'label-align', alignment);
}

export function setQuestionChoiceLabelAlignment(
  question: ExamQuestion,
  selection: Exclude<ChoiceLabelAlignmentSelection, 'custom'>,
): ExamQuestion {
  let choicesSetup = removeQuestionChoiceOption(question.choicesSetup, 'label-align');

  if (selection !== 'inherit') {
    choicesSetup = setChoicesSetupOption(choicesSetup, 'label-align', selection);
  }

  return withQuestionChoicesSetup(question, choicesSetup);
}

export function setQuestionChoiceIndex(
  question: ExamQuestion,
  value: number | 'inherit',
): ExamQuestion {
  let choicesSetup = removeQuestionChoiceOption(question.choicesSetup, 'index');

  if (value !== 'inherit') {
    choicesSetup = setChoicesSetupOption(choicesSetup, 'index', Math.max(1, Math.floor(value)));
  }

  return withQuestionChoicesSetup(question, choicesSetup);
}

export function resolveChoiceLayout(
  document: Pick<ExamDocument, 'setup' | 'examZh'>,
  question: ExamQuestion,
): ResolvedChoiceLayout {
  const globalOptions = getEffectiveGlobalChoiceOptions(document);
  const questionOptions = getQuestionChoiceOptions(question);
  const effectiveOptions = { ...globalOptions, ...questionOptions };
  const hasQuestionColumns = Object.hasOwn(questionOptions, 'columns');
  const hasQuestionMaxColumns = Object.hasOwn(questionOptions, 'max-columns');
  const hasLocalLabel = Object.hasOwn(questionOptions, 'label');
  const hasCustomLabels = hasCustomChoiceDisplayLabels(question);
  const labelSource = hasLocalLabel
    ? 'question-counter'
    : hasCustomLabels
      ? 'custom-labels'
      : 'global-counter';

  return {
    columns: hasQuestionColumns
      ? toInteger(questionOptions.columns)
      : hasQuestionMaxColumns
        ? undefined
        : toInteger(globalOptions.columns),
    maxColumns: toInteger(effectiveOptions['max-columns']) ?? defaultMaxColumns,
    label:
      typeof (hasLocalLabel ? questionOptions.label : globalOptions.label) === 'string'
        ? String(hasLocalLabel ? questionOptions.label : globalOptions.label)
        : defaultChoiceLabel,
    labelPosition: getChoiceLabelPosition(effectiveOptions['label-pos']) ?? defaultLabelPosition,
    ...resolveAdvancedChoiceOptions(effectiveOptions),
    index: toPositiveInteger(effectiveOptions.index) ?? 1,
    labelSource,
    hasCustomLabels,
    localCounterActive: hasLocalLabel,
  };
}

export function resolveGlobalChoiceAdvancedLayout(
  document: Pick<ExamDocument, 'setup' | 'examZh'>,
): ResolvedGlobalChoiceAdvancedLayout {
  return resolveAdvancedChoiceOptions(getEffectiveGlobalChoiceOptions(document));
}

export function hasGlobalChoiceAdvancedOverrides(document: ExamDocument): boolean {
  const options = getEffectiveGlobalChoiceOptions(document);
  return advancedChoiceOptionKeys.some((key) => Object.hasOwn(options, key));
}

export function hasQuestionChoiceAdvancedOverrides(question: ExamQuestion): boolean {
  const options = getQuestionChoiceOptions(question);
  return advancedChoiceOptionKeys.some((key) => Object.hasOwn(options, key));
}

export function getChoiceIndexExample(
  question: ExamQuestion,
  layout: ResolvedChoiceLayout,
  index = layout.index,
): string {
  if (layout.labelSource === 'custom-labels') {
    return '逐项自定义标签生效时，起始序号暂不作用';
  }

  const preset = getChoiceLabelPresetId(layout.label);

  if (!preset) {
    return `从第 ${index} 项开始；最终标签以 PDF 为准`;
  }

  const count = Math.min(4, Math.max(1, question.choices?.length ?? 1));
  const labels = Array.from({ length: count }, (_, offset) =>
    formatQuestionLabel(index + offset, getChoiceLabelPresetValue(preset)),
  );
  return `从 ${index} 开始：${labels.join('、')}`;
}

export function getChoiceIndexRangeWarning(
  question: ExamQuestion,
  layout: ResolvedChoiceLayout,
  index = layout.index,
): string | undefined {
  if (layout.labelSource === 'custom-labels') {
    return undefined;
  }

  const preset = getChoiceLabelPresetId(layout.label);
  const lastIndex = index + Math.max(1, question.choices?.length ?? 1) - 1;

  if ((preset === 'Alph' || preset === 'alph') && lastIndex > 26) {
    return '当前字母标签会超过 26；请降低起始序号或改用数字/罗马数字。';
  }

  if (preset === 'circlednumber' && lastIndex > 50) {
    return 'exam-zh 带圈数字只支持到 50；请降低起始序号或更换标签样式。';
  }

  return undefined;
}

export function latexDimensionToCssLength(value: string): string | undefined {
  const match = /^\s*(-?(?:\d+(?:\.\d*)?|\.\d+))\s*(pt|em|ex)\b/iu.exec(value);
  return match ? `${Number(match[1])}${match[2].toLowerCase()}` : undefined;
}

export function getResolvedChoiceDisplayLabel(
  question: ExamQuestion,
  choiceIndex: number,
  layout: ResolvedChoiceLayout,
): string {
  const choice = question.choices?.[choiceIndex];

  if (!choice) {
    return getDefaultChoiceDisplayLabel(choiceIndex);
  }

  if (layout.labelSource === 'custom-labels') {
    return getChoiceDisplayLabel(choice);
  }

  return (
    formatChoiceCounterLabel(layout.label, layout.index + choiceIndex) ??
    getChoiceDisplayLabel(choice)
  );
}

export function getResolvedChoiceAnswerLabel(
  question: ExamQuestion,
  choiceIndex: number,
  layout: ResolvedChoiceLayout,
): string {
  const displayLabel = getResolvedChoiceDisplayLabel(question, choiceIndex, layout);

  return layout.labelSource === 'custom-labels' ? displayLabel : displayLabel.replace(/\.$/u, '');
}

export function hasCustomChoiceDisplayLabels(question: ExamQuestion): boolean {
  return (question.choices ?? []).some(
    (choice, index) => getChoiceDisplayLabel(choice) !== getDefaultChoiceDisplayLabel(index),
  );
}

export function resetChoiceDisplayLabels(question: ExamQuestion): ExamQuestion {
  if (!question.choices?.length) {
    return question;
  }

  return {
    ...question,
    choices: question.choices.map((choice, index) => ({
      ...choice,
      label: getDefaultChoiceDisplayLabel(index),
    })),
  };
}

export function getDefaultChoiceDisplayLabel(index: number): string {
  return index >= 0 && index < 26 ? String.fromCharCode(65 + index) : String(index + 1);
}

export function choiceContentHasVisualBlocks(choice: ChoiceOption): boolean {
  return choice.content.some(
    (block) =>
      block.type === 'image' || block.type === 'figureGroup' || block.type === 'textFigure',
  );
}

export function getEffectiveChoiceLabelPosition(
  position: ChoiceLabelPosition,
  choice: ChoiceOption,
): ChoiceLabelPosition {
  return position === 'auto'
    ? choiceContentHasVisualBlocks(choice)
      ? 'left'
      : 'top-left'
    : position;
}

export function getEffectiveGlobalChoiceOptions(
  document: Pick<ExamDocument, 'setup'>,
): ExamZhOptionBag {
  const canonical: ExamZhOptionBag = {};

  if (document.setup.choices?.maxColumns !== undefined) {
    canonical['max-columns'] = document.setup.choices.maxColumns;
  }

  Object.assign(canonical, extractLocalChoiceOptions(document.setup.choices?.examZhOptions));

  return {
    ...canonical,
    ...extractScopedChoiceOptions(document.setup.examZhOptions),
  };
}

export function getQuestionChoiceOptions(question: ExamQuestion): ExamZhOptionBag {
  const options: ExamZhOptionBag = {};

  if (question.choicesSetup?.maxColumns !== undefined) {
    options['max-columns'] = question.choicesSetup.maxColumns;
  }

  return {
    ...options,
    ...extractLocalChoiceOptions(question.choicesSetup?.examZhOptions),
  };
}

function getHorizontalDensitySelection(
  options: ExamZhOptionBag,
  emptySelection: 'inherit' | 'upstream',
): ChoiceHorizontalDensitySelection {
  const hasColumnSep = Object.hasOwn(options, 'column-sep');
  const hasLabelSep = Object.hasOwn(options, 'label-sep');

  if (!hasColumnSep && !hasLabelSep) {
    return emptySelection;
  }

  if (!hasColumnSep || !hasLabelSep) {
    return 'custom';
  }

  const preset = choiceHorizontalDensityPresets.find(
    (item) =>
      options['column-sep'] === item.values.columnSep &&
      options['label-sep'] === item.values.labelSep,
  );
  return preset?.id ?? 'custom';
}

function getVerticalSpacingSelection(
  options: ExamZhOptionBag,
  emptySelection: 'inherit' | 'upstream',
): ChoiceVerticalSpacingSelection {
  const keys = ['top-sep', 'bottom-sep', 'linesep'] as const;
  const presentKeys = keys.filter((key) => Object.hasOwn(options, key));

  if (presentKeys.length === 0) {
    return emptySelection;
  }

  if (presentKeys.length !== keys.length) {
    return 'custom';
  }

  const preset = choiceVerticalSpacingPresets.find(
    (item) =>
      options['top-sep'] === item.values.topSep &&
      options['bottom-sep'] === item.values.bottomSep &&
      options.linesep === item.values.lineSep,
  );
  return preset?.id ?? 'custom';
}

function getLabelWidthSelection(
  options: ExamZhOptionBag,
  emptySelection: 'inherit' | 'auto',
): ChoiceLabelWidthSelection {
  if (!Object.hasOwn(options, 'label-width')) {
    return emptySelection;
  }

  const preset = choiceLabelWidthPresets.find((item) => options['label-width'] === item.value);
  return preset?.id ?? 'custom';
}

function getLabelAlignmentSelection(
  options: ExamZhOptionBag,
  emptySelection: 'inherit' | 'left',
): ChoiceLabelAlignmentSelection {
  if (!Object.hasOwn(options, 'label-align')) {
    return emptySelection;
  }

  const value = options['label-align'];
  return typeof value === 'string' && choiceLabelAlignmentOptions.some((item) => item.id === value)
    ? (value as ChoiceLabelAlignment)
    : 'custom';
}

function resolveAdvancedChoiceOptions(
  options: ExamZhOptionBag,
): ResolvedGlobalChoiceAdvancedLayout {
  const labelAlignment = getLabelAlignmentSelection(options, 'left');

  return {
    columnSep: getStringOption(options['column-sep'], defaultColumnSep),
    labelSep: getStringOption(options['label-sep'], defaultLabelSep),
    labelWidth: getStringOption(options['label-width'], defaultLabelWidth),
    labelAlignment:
      labelAlignment === 'custom'
        ? defaultLabelAlignment
        : (labelAlignment as ChoiceLabelAlignment),
    topSep: getStringOption(options['top-sep'], defaultTopSep),
    bottomSep: getStringOption(options['bottom-sep'], defaultBottomSep),
    lineSep: getStringOption(options.linesep, defaultLineSep),
  };
}

function getStringOption(value: ExamZhOptionValue | undefined, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function getLabelWidthValue(selection: ChoiceLabelWidthPresetId): string {
  return choiceLabelWidthPresets.find((item) => item.id === selection)?.value ?? defaultLabelWidth;
}

function normalizeCustomValue(value: string): string | undefined {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function getArrangementSelection(options: ExamZhOptionBag): ChoiceArrangementSelection {
  if (Object.hasOwn(options, 'columns')) {
    const columns = toInteger(options.columns);

    if (columns !== undefined && columns >= 1 && columns <= 4) {
      return `fixed-${columns}` as ChoiceArrangementSelection;
    }

    return 'custom';
  }

  const maxColumns = toInteger(options['max-columns']) ?? defaultMaxColumns;

  return maxColumns === 4 || maxColumns === 2 || maxColumns === 1
    ? (`auto-${maxColumns}` as ChoiceArrangementSelection)
    : 'custom';
}

function getArrangementValue(selection: ChoiceArrangementSelection): number {
  const value = Number(selection.slice(selection.lastIndexOf('-') + 1));
  return Number.isInteger(value) && value >= 1 ? value : defaultMaxColumns;
}

function getChoiceLabelPresetId(value: ExamZhOptionValue | undefined): ChoiceLabelPresetId | null {
  if (typeof value !== 'string') {
    return null;
  }

  return choiceLabelPresets.find((preset) => preset.value === value.trim())?.id ?? null;
}

function getChoiceLabelPresetValue(presetId: ChoiceLabelPresetId): string {
  return choiceLabelPresets.find((preset) => preset.id === presetId)?.value ?? defaultChoiceLabel;
}

function getChoiceLabelPosition(value: ExamZhOptionValue | undefined): ChoiceLabelPosition | null {
  return typeof value === 'string' &&
    choiceLabelPositionOptions.some((option) => option.id === value)
    ? (value as ChoiceLabelPosition)
    : null;
}

function formatChoiceCounterLabel(label: string, number: number): string | null {
  const preset = choiceLabelPresets.find((item) => item.value === label.trim());
  return preset ? formatQuestionLabel(number, preset.value) : null;
}

function extractLocalChoiceOptions(options: ExamZhOptionBag | undefined): ExamZhOptionBag {
  if (!options) {
    return {};
  }

  const scoped = extractScopedChoiceOptions(options);
  const local = Object.fromEntries(
    Object.entries(options).filter(([key]) => key !== 'choices' && !key.startsWith('choices/')),
  );

  return { ...local, ...scoped };
}

function extractScopedChoiceOptions(options: ExamZhOptionBag | undefined): ExamZhOptionBag {
  if (!options) {
    return {};
  }

  const scoped: ExamZhOptionBag = {};
  const nested = options.choices;

  if (isOptionBag(nested)) {
    Object.assign(scoped, nested);
  }

  for (const [key, value] of Object.entries(options)) {
    if (key.startsWith('choices/')) {
      scoped[key.slice('choices/'.length)] = value;
    }
  }

  return scoped;
}

function removeManagedGlobalChoiceOptions(
  document: ExamDocument,
  keys: readonly ManagedChoiceOptionKey[],
): ExamDocument {
  return keys.reduce(removeManagedGlobalChoiceOption, document);
}

function setGlobalChoiceOptionValues(
  document: ExamDocument,
  values: Partial<Record<ManagedChoiceOptionKey, ExamZhOptionValue | undefined>>,
): ExamDocument {
  return Object.entries(values).reduce((current, [key, value]) => {
    if (value === undefined || key === 'max-columns') {
      return current;
    }

    return setCanonicalGlobalChoiceOption(
      current,
      key as Exclude<ManagedChoiceOptionKey, 'max-columns'>,
      value,
    );
  }, document);
}

function removeQuestionChoiceOptions(
  choicesSetup: ChoicesSetup | undefined,
  keys: readonly ManagedChoiceOptionKey[],
): ChoicesSetup | undefined {
  return keys.reduce(removeQuestionChoiceOption, choicesSetup);
}

function setChoicesSetupOptionValues(
  choicesSetup: ChoicesSetup | undefined,
  values: Partial<Record<ManagedChoiceOptionKey, ExamZhOptionValue | undefined>>,
): ChoicesSetup | undefined {
  const next = Object.entries(values).reduce((current, [key, value]) => {
    return value === undefined
      ? current
      : setChoicesSetupOption(current, key as ManagedChoiceOptionKey, value);
  }, choicesSetup);
  return next && isEmptyChoicesSetup(next) ? undefined : next;
}

function removeManagedGlobalChoiceOption(
  document: ExamDocument,
  key: ManagedChoiceOptionKey,
): ExamDocument {
  const setup = { ...document.setup };
  const choices = setup.choices ? { ...setup.choices } : undefined;

  if (choices) {
    if (key === 'max-columns') {
      delete choices.maxColumns;
    }

    const examZhOptions = removeChoiceOptionFromBag(choices.examZhOptions, key, true);

    if (examZhOptions) {
      choices.examZhOptions = examZhOptions;
    } else {
      delete choices.examZhOptions;
    }

    if (isEmptyChoicesSetup(choices)) {
      delete setup.choices;
    } else {
      setup.choices = choices;
    }
  }

  const setupExamZhOptions = removeChoiceOptionFromBag(setup.examZhOptions, key, false);

  if (setupExamZhOptions) {
    setup.examZhOptions = setupExamZhOptions;
  } else {
    delete setup.examZhOptions;
  }

  return { ...document, setup };
}

function setCanonicalGlobalMaxColumns(document: ExamDocument, maxColumns: number): ExamDocument {
  const choices = { ...(document.setup.choices ?? {}), maxColumns };

  return {
    ...document,
    setup: { ...document.setup, choices },
  };
}

function setCanonicalGlobalChoiceOption(
  document: ExamDocument,
  key: Exclude<ManagedChoiceOptionKey, 'max-columns'>,
  value: ExamZhOptionValue,
): ExamDocument {
  const choices = setChoicesSetupOption(document.setup.choices, key, value);

  return {
    ...document,
    setup: { ...document.setup, choices },
  };
}

function removeQuestionChoiceOption(
  choicesSetup: ChoicesSetup | undefined,
  key: ManagedChoiceOptionKey,
): ChoicesSetup | undefined {
  if (!choicesSetup) {
    return undefined;
  }

  const next = { ...choicesSetup };

  if (key === 'max-columns') {
    delete next.maxColumns;
  }

  const examZhOptions = removeChoiceOptionFromBag(next.examZhOptions, key, true);

  if (examZhOptions) {
    next.examZhOptions = examZhOptions;
  } else {
    delete next.examZhOptions;
  }

  return isEmptyChoicesSetup(next) ? undefined : next;
}

function setChoicesSetupOption(
  choicesSetup: ChoicesSetup | undefined,
  key: string,
  value: ExamZhOptionValue,
): ChoicesSetup {
  return {
    ...(choicesSetup ?? {}),
    examZhOptions: {
      ...(choicesSetup?.examZhOptions ?? {}),
      [key]: value,
    },
  };
}

function withQuestionChoicesSetup(
  question: ExamQuestion,
  choicesSetup: ChoicesSetup | undefined,
): ExamQuestion {
  const next = { ...question };

  if (choicesSetup) {
    next.choicesSetup = choicesSetup;
  } else {
    delete next.choicesSetup;
  }

  return next;
}

function removeChoiceOptionFromBag(
  options: ExamZhOptionBag | undefined,
  key: ManagedChoiceOptionKey,
  includeLocalKey: boolean,
): ExamZhOptionBag | undefined {
  if (!options) {
    return undefined;
  }

  const next: ExamZhOptionBag = { ...options };

  if (includeLocalKey) {
    delete next[key];
  }

  delete next[`choices/${key}`];

  if (isOptionBag(next.choices)) {
    const nested = { ...next.choices };
    delete nested[key];

    if (Object.keys(nested).length === 0) {
      delete next.choices;
    } else {
      next.choices = nested;
    }
  }

  return Object.keys(next).length > 0 ? next : undefined;
}

function isEmptyChoicesSetup(choicesSetup: ChoicesSetup): boolean {
  return (
    choicesSetup.maxColumns === undefined &&
    (!choicesSetup.examZhOptions || Object.keys(choicesSetup.examZhOptions).length === 0)
  );
}

function isOptionBag(value: ExamZhOptionValue | undefined): value is ExamZhOptionBag {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toInteger(value: ExamZhOptionValue | undefined): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === 'string' && /^\d+$/u.test(value.trim())) {
    return Number(value);
  }

  return undefined;
}

function toPositiveInteger(value: ExamZhOptionValue | undefined): number | undefined {
  const integer = toInteger(value);
  return integer !== undefined && integer > 0 ? integer : undefined;
}
