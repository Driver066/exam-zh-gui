import { describe, expect, it } from 'vitest';

import { documentValidationErrorMessage, errorMessage, fail, ok } from './result';

describe('IPC result helpers', () => {
  it('wraps successful data', () => {
    expect(ok({ value: 1 })).toEqual({ ok: true, data: { value: 1 } });
  });

  it('wraps errors with a stable shape', () => {
    expect(fail('failed', 'Something went wrong')).toEqual({
      ok: false,
      error: { code: 'failed', message: 'Something went wrong' },
    });
  });

  it('normalizes unknown error messages', () => {
    expect(errorMessage(new Error('broken'))).toBe('broken');
    expect(errorMessage('plain')).toBe('plain');
  });

  it('summarizes validation issues for document actions', () => {
    const message = documentValidationErrorMessage({
      issues: [
        { message: '选择题只能有一个选择括号位置。' },
        { message: '选择题只能有一个选择括号位置。' },
        { message: '题干横线占位只能用于题干类文本。' },
      ],
    });

    expect(message).toBe(
      '试卷内容需要处理：选择题只能有一个选择括号位置。；题干横线占位只能用于题干类文本。',
    );
  });
});
