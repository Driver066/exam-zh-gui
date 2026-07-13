import { describe, expect, it } from 'vitest';

import {
  getParenAnswerColorSelection,
  getPreviewParenAnswerColor,
  summarizeRichContent,
} from './question-ui-options';

describe('question UI options', () => {
  it('maps upstream parenthesis answer colors to GUI selections', () => {
    expect(getParenAnswerColorSelection(undefined)).toBe('black');
    expect(getParenAnswerColorSelection({ 'paren/text-color': 'black' })).toBe('black');
    expect(getParenAnswerColorSelection({ 'paren/text-color': 'red' })).toBe('red');
    expect(getParenAnswerColorSelection({ 'paren/text-color': 'blue' })).toBe('custom');
  });

  it('uses a safe preview fallback for custom TeX colors', () => {
    expect(getPreviewParenAnswerColor({ 'paren/text-color': 'red' })).toBe('red');
    expect(getPreviewParenAnswerColor({ 'paren/text-color': 'customcolor' })).toBe('black');
  });

  it('builds compact summaries for collapsed rich-content editors', () => {
    expect(
      summarizeRichContent(
        [{ type: 'paragraph', children: [{ type: 'text', text: '第一行\n第二行' }] }],
        '暂无内容',
      ),
    ).toBe('第一行 第二行');
    expect(summarizeRichContent([], '暂无内容')).toBe('暂无内容');
    expect(
      summarizeRichContent(
        [{ type: 'paragraph', children: [{ type: 'text', text: '这是一段很长的选项内容' }] }],
        '暂无内容',
        6,
      ),
    ).toBe('这是一段很长…');
  });
});
