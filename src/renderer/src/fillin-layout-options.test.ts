import { describe, expect, it } from 'vitest';

import { createEmptyExamDocument } from '../../shared/document';
import {
  fillinCounterLabelPresets,
  consumeFillinCounterPreviewLabel,
  formatFillinCounterLabel,
  getBlankFillinNoAnswerSelection,
  getFillinCounterExample,
  getFillinCounterRangeWarning,
  getGlobalFillinCounterIndex,
  getGlobalFillinCounterLabelSelection,
  getGlobalFillinNoAnswerSelection,
  resolveFillinLayout,
  setBlankFillinNoAnswerType,
  setBlankFillinParenType,
  setBlankFillinWidthType,
  setGlobalFillinBoxColor,
  setGlobalFillinCounterIndex,
  setGlobalFillinCounterLabel,
  setGlobalFillinNoAnswerType,
  setGlobalFillinParenType,
  setGlobalFillinTextColor,
  setGlobalFillinWidthType,
} from './fillin-layout-options';

describe('fillin layout options', () => {
  it('uses sparse upstream defaults and writes canonical global options', () => {
    let document = createEmptyExamDocument('doc-fillin-defaults');

    expect(getGlobalFillinNoAnswerSelection(document)).toBe('blacktriangle');
    expect(resolveFillinLayout(document)).toMatchObject({
      noAnswerType: 'blacktriangle',
      textColor: 'black',
      boxColor: 'black',
      parenType: 'banjiao',
      widthType: 'normal',
      counterIndex: 1,
      counterLabel: '\\arabic*',
    });

    document = setGlobalFillinNoAnswerType(document, 'none');
    document = setGlobalFillinTextColor(document, 'red');
    document = setGlobalFillinBoxColor(document, 'red');
    document = setGlobalFillinParenType(document, 'quanjiao');
    document = setGlobalFillinWidthType(document, 'fill');

    expect(document.setup.fillin).toEqual({
      answerColor: 'red',
      examZhOptions: {
        'no-answer-type': 'none',
        'box-color': 'red',
        'paren-type': 'quanjiao',
        'width-type': 'fill',
      },
    });

    document = setGlobalFillinNoAnswerType(document, 'blacktriangle');
    document = setGlobalFillinTextColor(document, 'black');
    document = setGlobalFillinBoxColor(document, 'black');
    document = setGlobalFillinParenType(document, 'banjiao');
    document = setGlobalFillinWidthType(document, 'normal');
    expect(document.setup.fillin).toBeUndefined();
  });

  it('removes only matching flat and nested conflicts when a global key is managed', () => {
    const document = createEmptyExamDocument('doc-fillin-conflicts');
    document.setup.fillin = {
      width: '6em',
      examZhOptions: { 'text-color': 'green', depth: '.5em' },
    };
    document.setup.examZhOptions = {
      'fillin/text-color': 'blue',
      fillin: { 'text-color': 'purple', 'box-color': 'blue' },
      'notice/label': '说明：',
    };

    const next = setGlobalFillinTextColor(document, 'red');
    expect(next.setup.fillin).toEqual({
      width: '6em',
      answerColor: 'red',
      examZhOptions: { depth: '.5em' },
    });
    expect(next.setup.examZhOptions).toEqual({
      fillin: { 'box-color': 'blue' },
      'notice/label': '说明：',
    });
  });

  it('supports seven built-in counter labels and preserves non-default settings while inactive', () => {
    let document = createEmptyExamDocument('doc-fillin-counter');
    document = setGlobalFillinNoAnswerType(document, 'counter');
    document = setGlobalFillinCounterLabel(document, 'Alph');
    document = setGlobalFillinCounterIndex(document, 5);

    expect(fillinCounterLabelPresets).toHaveLength(7);
    expect(getGlobalFillinCounterLabelSelection(document)).toBe('Alph');
    expect(getGlobalFillinCounterIndex(document)).toBe(5);
    expect(getFillinCounterExample('\\Alph*', 5)).toBe('从 5 开始：E、F、G');

    document = setGlobalFillinNoAnswerType(document, 'none');
    expect(document.setup.fillin?.examZhOptions).toMatchObject({
      'no-answer-type': 'none',
      'no-answer-counter-label': '\\Alph*',
      'no-answer-counter-index': 5,
    });

    document = setGlobalFillinCounterLabel(document, 'arabic');
    document = setGlobalFillinCounterIndex(document, 1);
    expect(document.setup.fillin?.examZhOptions).toEqual({ 'no-answer-type': 'none' });
  });

  it('formats counter labels and reports supported range warnings', () => {
    expect(formatFillinCounterLabel('\\roman*', 14)).toBe('xiv');
    expect(formatFillinCounterLabel('\\circlednumber*', 21)).toBe('㉑');
    expect(formatFillinCounterLabel('\\tikzcirclednumber*', 36)).toBe('㊱');
    expect(getFillinCounterRangeWarning('\\alph*', 25, 3)).toContain('超过 26');
    expect(getFillinCounterRangeWarning('\\circlednumber*', 49, 3)).toContain('只支持到 50');
  });

  it('uses semantic blank overrides and removes conflicting scoped keys', () => {
    const blank = {
      id: 'blank-1',
      examZhOptions: {
        'no-answer-type': 'none',
        'fillin/paren-type': 'quanjiao',
        fillin: { 'width-type': 'fill', 'text-color': 'green' },
      },
    } as const;

    let next = setBlankFillinNoAnswerType(blank, 'counter');
    next = setBlankFillinParenType(next, 'banjiao');
    next = setBlankFillinWidthType(next, 'normal');

    expect(next).toEqual({
      id: 'blank-1',
      noAnswerType: 'counter',
      parenType: 'banjiao',
      widthType: 'normal',
      examZhOptions: { fillin: { 'text-color': 'green' } },
    });
    expect(getBlankFillinNoAnswerSelection(next)).toBe('counter');

    next = setBlankFillinNoAnswerType(next, 'inherit');
    next = setBlankFillinParenType(next, 'inherit');
    next = setBlankFillinWidthType(next, 'inherit');
    expect(next).toEqual({ id: 'blank-1', examZhOptions: { fillin: { 'text-color': 'green' } } });
  });

  it('resolves global and blank precedence including a local counter reset', () => {
    const document = createEmptyExamDocument('doc-fillin-resolved');
    document.setup.answerMode = 'student';
    document.setup.fillin = {
      examZhOptions: {
        'no-answer-type': 'counter',
        'no-answer-counter-index': 3,
        'no-answer-counter-label': '\\Roman*',
        'text-color': 'red',
      },
    };

    expect(
      resolveFillinLayout(document, {
        id: 'blank-1',
        type: 'paren',
        parenType: 'quanjiao',
        examZhOptions: { 'no-answer-counter-index': 8 },
      }),
    ).toMatchObject({
      type: 'paren',
      parenType: 'quanjiao',
      noAnswerType: 'counter',
      counterIndex: 8,
      localCounterIndex: 8,
      counterLabel: '\\Roman*',
      textColor: 'red',
    });
  });

  it('increments preview counters by occurrence and honors local resets', () => {
    const document = createEmptyExamDocument('doc-fillin-occurrences');
    document.setup.fillin = {
      examZhOptions: {
        'no-answer-type': 'counter',
        'no-answer-counter-index': 3,
        'no-answer-counter-label': '\\Alph*',
      },
    };
    const state = { next: 3 };
    const repeated = resolveFillinLayout(document, { id: 'blank-repeated' });
    const reset = resolveFillinLayout(document, {
      id: 'blank-reset',
      examZhOptions: { 'no-answer-counter-index': 8 },
    });

    expect(consumeFillinCounterPreviewLabel(repeated, state)).toBe('C');
    expect(consumeFillinCounterPreviewLabel(repeated, state)).toBe('D');
    expect(consumeFillinCounterPreviewLabel(reset, state)).toBe('H');
    expect(consumeFillinCounterPreviewLabel(repeated, state)).toBe('I');
  });
});
