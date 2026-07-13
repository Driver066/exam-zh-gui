import { describe, expect, it } from 'vitest';

import {
  getQuestionTeacherContentLabel,
  getSubQuestionTeacherContentLabel,
} from './draft-preview-labels';

describe('draft preview labels', () => {
  it('uses answer labels for problem teacher content', () => {
    expect(getQuestionTeacherContentLabel('problem')).toBe('解答');
    expect(getSubQuestionTeacherContentLabel('problem')).toBe('小题解答');
  });

  it('keeps analysis labels for choice and blank questions', () => {
    expect(getQuestionTeacherContentLabel('singleChoice')).toBe('解析');
    expect(getQuestionTeacherContentLabel('multipleChoice')).toBe('解析');
    expect(getQuestionTeacherContentLabel('blank')).toBe('解析');
    expect(getSubQuestionTeacherContentLabel('singleChoice')).toBe('小题解析');
  });
});
