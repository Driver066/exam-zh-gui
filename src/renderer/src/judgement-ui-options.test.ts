import { describe, expect, it } from 'vitest';

import { createDefaultQuestion, createEmptyExamDocument } from '../../shared/document';
import {
  getGlobalJudgementAnswerColor,
  getJudgementAnswerSelection,
  getJudgementAnswerStyleSelection,
  insertJudgementPlaceholder,
  removeJudgementPlaceholders,
  setGlobalJudgementAnswerColor,
  setJudgementAnswerSelection,
  setJudgementAnswerStyle,
  setJudgementPlacementAndStem,
} from './judgement-ui-options';

const createId = (prefix: string) => `${prefix}-1`;

describe('judgement UI options', () => {
  it('maps answer state without losing false and cleans the unset default', () => {
    let question = createDefaultQuestion('judgement', createId);

    expect(getJudgementAnswerSelection(question)).toBe('unset');
    question = setJudgementAnswerSelection(question, 'incorrect');
    expect(question.judgement?.correctAnswer).toBe(false);
    expect(getJudgementAnswerSelection(question)).toBe('incorrect');
    question = setJudgementAnswerSelection(question, 'unset');
    expect(question.judgement).toBeUndefined();
  });

  it('keeps text sparse and stores the symbol answer style', () => {
    let question = createDefaultQuestion('judgement', createId);

    question = setJudgementAnswerStyle(question, 'symbol');
    expect(getJudgementAnswerStyleSelection(question)).toBe('symbol');
    question = setJudgementAnswerStyle(question, 'text');
    expect(question.judgement).toBeUndefined();
  });

  it('maps global black and red while deleting the default setup object', () => {
    let document = createEmptyExamDocument('judgement-color');

    document = setGlobalJudgementAnswerColor(document, 'red');
    expect(getGlobalJudgementAnswerColor(document)).toBe('red');
    expect(document.setup.judgement).toEqual({ answerColor: 'red' });
    document = setGlobalJudgementAnswerColor(document, 'black');
    expect(document.setup.judgement).toBeUndefined();
  });

  it('inserts at the selection, avoids duplicates, and restores line-end placement', () => {
    const inserted = insertJudgementPlaceholder('命题成立', { start: 2, end: 2 });
    const duplicate = insertJudgementPlaceholder(inserted.value, { start: 0, end: 0 });
    const restored = removeJudgementPlaceholders(duplicate.value);
    let question = createDefaultQuestion('judgement', createId);

    question = setJudgementPlacementAndStem(question, inserted.blocks, 'inline');
    expect(inserted.value).toBe('命题{{判断括号}}成立');
    expect(duplicate.value).toBe(inserted.value);
    expect(question.judgement?.placement).toBe('inline');
    question = setJudgementPlacementAndStem(question, restored.blocks, 'lineEnd');
    expect(question.judgement).toBeUndefined();
    expect(restored.value).toBe('命题成立');
  });
});
