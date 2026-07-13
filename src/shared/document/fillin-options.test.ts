import { describe, expect, it } from 'vitest';

import { createEmptyExamDocument } from './defaults';
import { buildEffectiveFillinOptions } from './fillin-options';

describe('effective fillin options', () => {
  it('preserves the upstream blacktriangle default by leaving no-answer-type unset', () => {
    const document = createEmptyExamDocument('doc-default-fillin');

    expect(buildEffectiveFillinOptions(document)).toEqual({ 'show-answer': false });
  });

  it('applies semantic, scoped, flat, nested, answer-mode, and blank precedence', () => {
    const document = createEmptyExamDocument('doc-effective-fillin');
    document.setup.answerMode = 'teacher';
    document.setup.fillin = {
      type: 'line',
      width: '4em',
      examZhOptions: { type: 'paren', 'text-color': 'red' },
    };
    document.setup.examZhOptions = {
      'fillin/type': 'rectangle',
      'fillin/width': '6em',
      fillin: { 'box-color': 'blue', 'no-answer-type': 'counter' },
      'fillin/no-answer-type': 'none',
    };

    expect(
      buildEffectiveFillinOptions(document, {
        id: 'blank-1',
        type: 'line',
        width: '8em',
        noAnswerType: 'counter',
        examZhOptions: { 'show-answer': false, 'text-color': 'green' },
      }),
    ).toEqual({
      type: 'line',
      width: '8em',
      'text-color': 'green',
      'no-answer-type': 'counter',
      'box-color': 'blue',
      'show-answer': false,
    });
  });
});
