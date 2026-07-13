import { describe, expect, it } from 'vitest';

import {
  createDefaultQuestion,
  createEmptyExamDocument,
  type ExamQuestion,
} from '../../shared/document';
import {
  choiceContentHasVisualBlocks,
  getEffectiveChoiceLabelPosition,
  getGlobalChoiceArrangementSelection,
  getGlobalChoiceHorizontalDensitySelection,
  getGlobalChoiceLabelAlignmentSelection,
  getGlobalChoiceLabelPositionSelection,
  getGlobalChoiceLabelSelection,
  getGlobalChoiceLabelWidthSelection,
  getGlobalChoiceVerticalSpacingSelection,
  getChoiceIndexExample,
  getChoiceIndexRangeWarning,
  getQuestionChoiceArrangementSelection,
  getQuestionChoiceHorizontalDensitySelection,
  getQuestionChoiceIndexSelection,
  getQuestionChoiceLabelPositionSelection,
  getQuestionChoiceLabelSelection,
  getQuestionChoiceLabelWidthSelection,
  getQuestionChoiceVerticalSpacingSelection,
  getResolvedChoiceAnswerLabel,
  getResolvedChoiceDisplayLabel,
  hasGlobalChoiceAdvancedOverrides,
  hasQuestionChoiceAdvancedOverrides,
  hasCustomChoiceDisplayLabels,
  latexDimensionToCssLength,
  resetChoiceDisplayLabels,
  resolveChoiceLayout,
  resolveGlobalChoiceAdvancedLayout,
  setGlobalChoiceArrangement,
  setGlobalChoiceHorizontalDensity,
  setGlobalChoiceHorizontalDensityCustom,
  setGlobalChoiceLabelAlignment,
  setGlobalChoiceLabelPosition,
  setGlobalChoiceLabelPreset,
  setGlobalChoiceLabelWidth,
  setGlobalChoiceVerticalSpacing,
  setQuestionChoiceArrangement,
  setQuestionChoiceHorizontalDensity,
  setQuestionChoiceHorizontalDensityCustom,
  setQuestionChoiceIndex,
  setQuestionChoiceLabelAlignment,
  setQuestionChoiceLabelPosition,
  setQuestionChoiceLabelPreset,
  setQuestionChoiceLabelWidth,
  setQuestionChoiceLabelWidthCustom,
  setQuestionChoiceVerticalSpacing,
  setQuestionChoiceVerticalSpacingCustom,
} from './choice-layout-options';

function createChoiceQuestion(): ExamQuestion {
  return createDefaultQuestion('singleChoice', sequenceIdFactory());
}

function sequenceIdFactory() {
  let nextId = 1;
  return (prefix: string) => `${prefix}-${nextId++}`;
}

describe('choice layout options', () => {
  it('uses sparse upstream defaults for global choice layout', () => {
    const document = createEmptyExamDocument('doc-choice-layout-defaults');

    expect(getGlobalChoiceArrangementSelection(document)).toBe('auto-4');
    expect(getGlobalChoiceLabelSelection(document)).toBe('Alph');
    expect(getGlobalChoiceLabelPositionSelection(document)).toBe('auto');

    const maxTwo = setGlobalChoiceArrangement(document, 'auto-2');
    expect(maxTwo.setup.choices).toEqual({ maxColumns: 2 });

    const fixedThree = setGlobalChoiceArrangement(maxTwo, 'fixed-3');
    expect(fixedThree.setup.choices).toEqual({ examZhOptions: { columns: 3 } });

    const restoredDefault = setGlobalChoiceArrangement(fixedThree, 'auto-4');
    expect(restoredDefault.setup.choices).toBeUndefined();
  });

  it('supports per-question inheritance, automatic caps, and fixed columns', () => {
    const question = createChoiceQuestion();

    expect(getQuestionChoiceArrangementSelection(question)).toBe('inherit');

    const automatic = setQuestionChoiceArrangement(question, 'auto-4');
    expect(automatic.choicesSetup).toEqual({ maxColumns: 4 });
    expect(getQuestionChoiceArrangementSelection(automatic)).toBe('auto-4');

    const fixed = setQuestionChoiceArrangement(automatic, 'fixed-2');
    expect(fixed.choicesSetup).toEqual({ examZhOptions: { columns: 2 } });

    const inherited = setQuestionChoiceArrangement(fixed, 'inherit');
    expect(inherited.choicesSetup).toBeUndefined();
  });

  it('lets a per-question automatic cap override a global fixed column count', () => {
    const document = setGlobalChoiceArrangement(
      createEmptyExamDocument('doc-choice-layout-global-fixed'),
      'fixed-2',
    );
    const inherited = createChoiceQuestion();
    const automatic = setQuestionChoiceArrangement(inherited, 'auto-4');

    expect(resolveChoiceLayout(document, inherited)).toMatchObject({
      columns: 2,
      maxColumns: 4,
    });
    expect(resolveChoiceLayout(document, automatic)).toMatchObject({
      columns: undefined,
      maxColumns: 4,
    });
  });

  it('preserves unrelated per-question options while changing arrangement', () => {
    const question: ExamQuestion = {
      ...createChoiceQuestion(),
      choicesSetup: {
        maxColumns: 2,
        examZhOptions: { columns: 3, linesep: '1ex' },
      },
    };

    const inherited = setQuestionChoiceArrangement(question, 'inherit');

    expect(inherited.choicesSetup).toEqual({ examZhOptions: { linesep: '1ex' } });
    expect(getQuestionChoiceArrangementSelection(inherited)).toBe('inherit');
  });

  it('maps global and per-question label and position presets sparsely', () => {
    const document = createEmptyExamDocument('doc-choice-layout-labels');
    const circled = setGlobalChoiceLabelPreset(document, 'circlednumber');
    const bottom = setGlobalChoiceLabelPosition(circled, 'bottom');

    expect(bottom.setup.choices?.examZhOptions).toEqual({
      label: '\\circlednumber*',
      'label-pos': 'bottom',
    });
    expect(getGlobalChoiceLabelSelection(bottom)).toBe('circlednumber');
    expect(getGlobalChoiceLabelPositionSelection(bottom)).toBe('bottom');

    const restored = setGlobalChoiceLabelPosition(
      setGlobalChoiceLabelPreset(bottom, 'Alph'),
      'auto',
    );
    expect(restored.setup.choices).toBeUndefined();

    const question = setQuestionChoiceLabelPosition(
      setQuestionChoiceLabelPreset(createChoiceQuestion(), 'Alph'),
      'left',
    );
    expect(question.choicesSetup?.examZhOptions).toEqual({
      label: '\\Alph*.',
      'label-pos': 'left',
    });
    expect(getQuestionChoiceLabelSelection(question)).toBe('Alph');
    expect(getQuestionChoiceLabelPositionSelection(question)).toBe('left');

    const inherited = setQuestionChoiceLabelPosition(
      setQuestionChoiceLabelPreset(question, 'inherit'),
      'inherit',
    );
    expect(inherited.choicesSetup).toBeUndefined();
  });

  it('keeps unknown existing values as custom until a preset is selected', () => {
    const document = createEmptyExamDocument('doc-choice-layout-custom');
    document.setup.choices = {
      maxColumns: 3,
      examZhOptions: { label: '\\custom*', 'label-pos': 'diagonal' },
    };
    const question: ExamQuestion = {
      ...createChoiceQuestion(),
      choicesSetup: {
        examZhOptions: { columns: 8, label: '\\other*', 'label-pos': 'beside' },
      },
    };

    expect(getGlobalChoiceArrangementSelection(document)).toBe('custom');
    expect(getGlobalChoiceLabelSelection(document)).toBe('custom');
    expect(getGlobalChoiceLabelPositionSelection(document)).toBe('custom');
    expect(getQuestionChoiceArrangementSelection(question)).toBe('custom');
    expect(getQuestionChoiceLabelSelection(question)).toBe('custom');
    expect(getQuestionChoiceLabelPositionSelection(question)).toBe('custom');
  });

  it('normalizes managed legacy keys without removing unrelated options', () => {
    const document = createEmptyExamDocument('doc-choice-layout-legacy');
    document.setup.examZhOptions = {
      'choices/columns': 4,
      choices: { 'max-columns': 2, label: '\\roman*.', linesep: '1ex' },
      'page/show-foot': false,
    };
    const next = setGlobalChoiceArrangement(document, 'fixed-2');

    expect(next.setup.choices).toEqual({ examZhOptions: { columns: 2 } });
    expect(next.setup.examZhOptions).toEqual({
      choices: { label: '\\roman*.', linesep: '1ex' },
      'page/show-foot': false,
    });
  });

  it('maps global advanced spacing presets sparsely', () => {
    const document = createEmptyExamDocument('doc-choice-layout-advanced-global');

    expect(getGlobalChoiceHorizontalDensitySelection(document)).toBe('upstream');
    expect(getGlobalChoiceVerticalSpacingSelection(document)).toBe('upstream');
    expect(hasGlobalChoiceAdvancedOverrides(document)).toBe(false);

    const compact = setGlobalChoiceHorizontalDensity(document, 'compact');
    const loose = setGlobalChoiceVerticalSpacing(compact, 'loose');

    expect(loose.setup.choices?.examZhOptions).toEqual({
      'column-sep': '.5em',
      'label-sep': '.25em',
      'top-sep': '.5em',
      'bottom-sep': '.5em',
      linesep: '.5em plus .25em',
    });
    expect(getGlobalChoiceHorizontalDensitySelection(loose)).toBe('compact');
    expect(getGlobalChoiceVerticalSpacingSelection(loose)).toBe('loose');
    expect(hasGlobalChoiceAdvancedOverrides(loose)).toBe(true);

    const restored = setGlobalChoiceVerticalSpacing(
      setGlobalChoiceHorizontalDensity(loose, 'upstream'),
      'upstream',
    );
    expect(restored.setup.choices).toBeUndefined();
  });

  it('distinguishes per-question inheritance from explicit upstream defaults', () => {
    const question = createChoiceQuestion();

    expect(getQuestionChoiceHorizontalDensitySelection(question)).toBe('inherit');
    expect(getQuestionChoiceVerticalSpacingSelection(question)).toBe('inherit');

    const upstreamHorizontal = setQuestionChoiceHorizontalDensity(question, 'upstream');
    const upstream = setQuestionChoiceVerticalSpacing(upstreamHorizontal, 'upstream');

    expect(upstream.choicesSetup?.examZhOptions).toEqual({
      'column-sep': '1em',
      'label-sep': '.5em',
      'top-sep': '0pt',
      'bottom-sep': '0pt',
      linesep: '0pt plus .5ex',
    });
    expect(getQuestionChoiceHorizontalDensitySelection(upstream)).toBe('upstream');
    expect(getQuestionChoiceVerticalSpacingSelection(upstream)).toBe('upstream');
    expect(hasQuestionChoiceAdvancedOverrides(upstream)).toBe(true);

    const inherited = setQuestionChoiceVerticalSpacing(
      setQuestionChoiceHorizontalDensity(upstream, 'inherit'),
      'inherit',
    );
    expect(inherited.choicesSetup).toBeUndefined();
  });

  it('applies custom spacing without changing unrelated choice options', () => {
    const document = createEmptyExamDocument('doc-choice-layout-advanced-custom');
    document.setup.examZhOptions = {
      'choices/column-sep': '3em',
      choices: { 'label-sep': '1em', linesep: '1ex', label: '\\roman*.' },
    };
    const custom = setGlobalChoiceHorizontalDensityCustom(document, {
      columnSep: ' 2em ',
      labelSep: '',
    });

    expect(custom.setup.choices?.examZhOptions).toEqual({ 'column-sep': '2em' });
    expect(custom.setup.examZhOptions).toEqual({
      choices: { linesep: '1ex', label: '\\roman*.' },
    });
    expect(getGlobalChoiceHorizontalDensitySelection(custom)).toBe('custom');

    const question: ExamQuestion = {
      ...createChoiceQuestion(),
      choicesSetup: { examZhOptions: { label: '\\Roman*.', 'label-width': '3em' } },
    };
    const spaced = setQuestionChoiceVerticalSpacingCustom(question, {
      topSep: '.2em',
      bottomSep: '',
      lineSep: '.4em plus .1em',
    });
    const horizontal = setQuestionChoiceHorizontalDensityCustom(spaced, {
      columnSep: '.75em',
      labelSep: '.4em',
    });

    expect(horizontal.choicesSetup?.examZhOptions).toEqual({
      label: '\\Roman*.',
      'label-width': '3em',
      'top-sep': '.2em',
      linesep: '.4em plus .1em',
      'column-sep': '.75em',
      'label-sep': '.4em',
    });
  });

  it('maps label width and alignment presets at both scopes', () => {
    const document = setGlobalChoiceLabelAlignment(
      setGlobalChoiceLabelWidth(createEmptyExamDocument('doc-choice-label-box'), 'standard'),
      'center',
    );

    expect(getGlobalChoiceLabelWidthSelection(document)).toBe('standard');
    expect(getGlobalChoiceLabelAlignmentSelection(document)).toBe('center');
    expect(resolveGlobalChoiceAdvancedLayout(document)).toMatchObject({
      labelWidth: '1.5em',
      labelAlignment: 'center',
    });

    const question = setQuestionChoiceLabelAlignment(
      setQuestionChoiceLabelWidth(createChoiceQuestion(), 'auto'),
      'right',
    );
    expect(question.choicesSetup?.examZhOptions).toEqual({
      'label-width': '0pt',
      'label-align': 'right',
    });
    expect(getQuestionChoiceLabelWidthSelection(question)).toBe('auto');

    const custom = setQuestionChoiceLabelWidthCustom(question, ' 2.75em ');
    expect(custom.choicesSetup?.examZhOptions?.['label-width']).toBe('2.75em');
    expect(getQuestionChoiceLabelWidthSelection(custom)).toBe('custom');
  });

  it('formats and validates per-question starting choice indexes', () => {
    const document = createEmptyExamDocument('doc-choice-index-controls');
    const question = setQuestionChoiceIndex(createChoiceQuestion(), 3);
    const layout = resolveChoiceLayout(document, question);

    expect(getQuestionChoiceIndexSelection(question)).toBe('specified');
    expect(getChoiceIndexExample(question, layout)).toBe('从 3 开始：C.、D.、E.、F.');
    expect(getChoiceIndexRangeWarning(question, layout)).toBeUndefined();
    expect(getResolvedChoiceDisplayLabel(question, 0, layout)).toBe('C.');

    const outOfRange = setQuestionChoiceIndex(question, 24);
    const outOfRangeLayout = resolveChoiceLayout(document, outOfRange);
    expect(getChoiceIndexRangeWarning(outOfRange, outOfRangeLayout)).toContain('超过 26');

    const circledDocument = setGlobalChoiceLabelPreset(document, 'circlednumber');
    const circled = setQuestionChoiceIndex(createChoiceQuestion(), 48);
    const circledLayout = resolveChoiceLayout(circledDocument, circled);
    expect(getChoiceIndexExample(circled, circledLayout)).toContain('48');
    expect(getChoiceIndexRangeWarning(circled, circledLayout)).toContain('只支持到 50');

    expect(getQuestionChoiceIndexSelection(setQuestionChoiceIndex(question, 'inherit'))).toBe(
      'inherit',
    );
  });

  it('parses only the fixed leading portion of safe preview dimensions', () => {
    expect(latexDimensionToCssLength('.5em plus .25em')).toBe('0.5em');
    expect(latexDimensionToCssLength(' -2.5pt minus 1pt')).toBe('-2.5pt');
    expect(latexDimensionToCssLength('1ex')).toBe('1ex');
    expect(latexDimensionToCssLength('\\baselineskip')).toBeUndefined();
    expect(latexDimensionToCssLength('calc(1em)')).toBeUndefined();
  });

  it('resolves local counter, custom labels, and global counter in priority order', () => {
    const document = setGlobalChoiceLabelPreset(
      createEmptyExamDocument('doc-choice-layout-priority'),
      'circlednumber',
    );
    const question = createChoiceQuestion();
    const globalLayout = resolveChoiceLayout(document, question);

    expect(globalLayout.labelSource).toBe('global-counter');
    expect(getResolvedChoiceDisplayLabel(question, 0, globalLayout)).toBe('①');
    expect(getResolvedChoiceAnswerLabel(question, 1, globalLayout)).toBe('②');

    const customQuestion: ExamQuestion = {
      ...question,
      choices: question.choices?.map((choice, index) =>
        index === 0 ? { ...choice, label: '甲' } : choice,
      ),
    };
    const customLayout = resolveChoiceLayout(document, customQuestion);

    expect(customLayout.labelSource).toBe('custom-labels');
    expect(getResolvedChoiceDisplayLabel(customQuestion, 0, customLayout)).toBe('甲');
    expect(getResolvedChoiceDisplayLabel(customQuestion, 1, customLayout)).toBe('B');

    const localQuestion = setQuestionChoiceLabelPreset(customQuestion, 'arabic');
    const localLayout = resolveChoiceLayout(document, localQuestion);

    expect(localLayout.labelSource).toBe('question-counter');
    expect(localLayout.localCounterActive).toBe(true);
    expect(getResolvedChoiceDisplayLabel(localQuestion, 0, localLayout)).toBe('1.');
    expect(getResolvedChoiceAnswerLabel(localQuestion, 1, localLayout)).toBe('2');
    expect(localQuestion.choices?.[0]?.label).toBe('甲');
  });

  it('respects counter index and falls back after the stable circled preview range', () => {
    const document = setGlobalChoiceLabelPreset(
      createEmptyExamDocument('doc-choice-layout-index'),
      'circlednumber',
    );
    document.setup.choices!.examZhOptions!.index = 20;
    const question = createChoiceQuestion();
    const layout = resolveChoiceLayout(document, question);

    expect(getResolvedChoiceDisplayLabel(question, 0, layout)).toBe('⑳');
    expect(getResolvedChoiceDisplayLabel(question, 1, layout)).toBe('21');
  });

  it('restores default visible labels without changing stable ids or answers', () => {
    const question = createChoiceQuestion();
    question.choices = question.choices?.map((choice, index) => ({
      ...choice,
      label: index === 0 ? '甲' : '乙',
    }));
    const stableIds = question.choices!.map((choice) => choice.id);
    question.correctChoiceIds = [stableIds[1]!];

    expect(hasCustomChoiceDisplayLabels(question)).toBe(true);

    const restored = resetChoiceDisplayLabels(question);

    expect(restored.choices?.map((choice) => choice.id)).toEqual(stableIds);
    expect(restored.choices?.map((choice) => choice.label)).toEqual(['A', 'B', 'C', 'D']);
    expect(restored.correctChoiceIds).toEqual([stableIds[1]]);
  });

  it('approximates automatic visual label positions', () => {
    const textChoice = createChoiceQuestion().choices![0]!;
    const imageChoice = {
      ...textChoice,
      content: [{ type: 'image' as const, assetId: 'asset-1', alt: '图形' }],
    };

    expect(choiceContentHasVisualBlocks(textChoice)).toBe(false);
    expect(choiceContentHasVisualBlocks(imageChoice)).toBe(true);
    expect(getEffectiveChoiceLabelPosition('auto', textChoice)).toBe('top-left');
    expect(getEffectiveChoiceLabelPosition('auto', imageChoice)).toBe('left');
    expect(getEffectiveChoiceLabelPosition('bottom', textChoice)).toBe('bottom');
  });
});
