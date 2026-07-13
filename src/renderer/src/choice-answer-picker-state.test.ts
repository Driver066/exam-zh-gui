import { describe, expect, it } from 'vitest';

import {
  formatChoiceAnswerTrigger,
  toggleMultipleChoiceAnswer,
  type ChoiceAnswerOption,
} from './choice-answer-picker-state';

const options: ChoiceAnswerOption[] = [
  { id: 'a', label: 'A.', summary: '−2' },
  { id: 'b', label: 'B.', summary: '一段很长的答案开头' },
  { id: 'c', label: 'C.', summary: '1' },
  { id: 'd', label: 'D.', summary: '2' },
];

describe('choice answer picker state', () => {
  it('formats empty, single, multiple, and invalid answer summaries', () => {
    expect(formatChoiceAnswerTrigger(options, [], false)).toEqual({
      text: '未设置',
      invalidCount: 0,
    });
    expect(formatChoiceAnswerTrigger(options, ['b'], false).text).toBe('B. 一段很长的答案开头');
    expect(formatChoiceAnswerTrigger(options, ['a', 'b', 'c'], true).text).toBe(
      'A. −2；B. 一段很长的答案开头；+1 项',
    );
    expect(formatChoiceAnswerTrigger(options, ['missing'], false)).toEqual({
      text: '答案引用失效',
      invalidCount: 1,
    });
  });

  it('toggles multiple answers in current option order', () => {
    expect(toggleMultipleChoiceAnswer(options, ['c'], 'a')).toEqual(['a', 'c']);
    expect(toggleMultipleChoiceAnswer(options, ['a', 'c'], 'a')).toEqual(['c']);
  });
});
