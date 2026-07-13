import { describe, expect, it } from 'vitest';

import { createEmptyExamDocument } from './factory';
import { formatJudgementAnswer, resolveJudgementSetup } from './judgement';

describe('judgement semantics', () => {
  it('resolves sparse defaults and the global answer color', () => {
    const document = createEmptyExamDocument('judgement-defaults');

    expect(resolveJudgementSetup(document, {})).toEqual({
      correctAnswer: undefined,
      answerStyle: 'text',
      placement: 'lineEnd',
      answerColor: 'black',
    });

    document.setup.judgement = { answerColor: 'red' };
    expect(resolveJudgementSetup(document, { judgement: { correctAnswer: false } })).toEqual({
      correctAnswer: false,
      answerStyle: 'text',
      placement: 'lineEnd',
      answerColor: 'red',
    });
  });

  it('formats text and symbol answers for LaTeX and draft preview', () => {
    expect(formatJudgementAnswer({ correctAnswer: true, answerStyle: 'text' }, 'latex')).toBe('对');
    expect(formatJudgementAnswer({ correctAnswer: false, answerStyle: 'text' }, 'unicode')).toBe(
      '错',
    );
    expect(formatJudgementAnswer({ correctAnswer: true, answerStyle: 'symbol' }, 'latex')).toBe(
      '$\\checkmark$',
    );
    expect(formatJudgementAnswer({ correctAnswer: false, answerStyle: 'symbol' }, 'unicode')).toBe(
      '×',
    );
    expect(
      formatJudgementAnswer({ correctAnswer: undefined, answerStyle: 'symbol' }, 'unicode'),
    ).toBe('');
  });
});
