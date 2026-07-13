import { describe, expect, it } from 'vitest';

import {
  parseRichContentInput,
  removeChoiceParenRefs,
  removeJudgementRefs,
  stringifyRichContentBlocks,
} from './rich-content';

describe('rich content textarea parser', () => {
  it('keeps a single newline inside one paragraph', () => {
    const result = parseRichContentInput('第一行\n第二行');

    expect(result.diagnostics).toEqual([]);
    expect(result.blocks).toEqual([
      {
        type: 'paragraph',
        children: [{ type: 'text', text: '第一行\n第二行' }],
      },
    ]);
    expect(stringifyRichContentBlocks(result.blocks)).toBe('第一行\n第二行');
  });

  it('uses blank lines as paragraph boundaries', () => {
    const result = parseRichContentInput('第一段\n\n第二段');

    expect(result.diagnostics).toEqual([]);
    expect(result.blocks).toEqual([
      {
        type: 'paragraph',
        children: [{ type: 'text', text: '第一段' }],
      },
      {
        type: 'paragraph',
        children: [{ type: 'text', text: '第二段' }],
      },
    ]);
    expect(stringifyRichContentBlocks(result.blocks)).toBe('第一段\n\n第二段');
  });

  it('parses text, inline math, display math, and blank placeholders', () => {
    const result = parseRichContentInput('若 $a=1$，则 {{第1空}}\n\n$$a+b=3$$', {
      blankIds: ['blank-1'],
    });

    expect(result.diagnostics).toEqual([]);
    expect(result.blocks).toEqual([
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: '若 ' },
          { type: 'inlineMath', latex: 'a=1' },
          { type: 'text', text: '，则 ' },
          { type: 'blankRef', blankId: 'blank-1' },
        ],
      },
      {
        type: 'displayMath',
        latex: 'a+b=3',
      },
    ]);
    expect(stringifyRichContentBlocks(result.blocks, ['blank-1'])).toBe(
      '若 $a=1$，则 {{第1空}}\n\n$$a+b=3$$',
    );
  });

  it('rejects the removed legacy blank placeholder spelling', () => {
    const result = parseRichContentInput('答案是 {{空1}}', {
      blankIds: ['blank-1'],
    });

    expect(result.diagnostics).toEqual([
      {
        code: 'unknown_placeholder',
        message: '占位符“{{空1}}”暂不支持。',
      },
    ]);
    expect(result.blocks).toEqual([
      {
        type: 'paragraph',
        children: [{ type: 'text', text: '答案是 {{空1}}' }],
      },
    ]);
  });

  it('parses choice parentheses and stem line placeholders', () => {
    const result = parseRichContentInput('这里 {{横线}} 应该选 {{选择括号}}', {
      context: 'choiceStem',
    });

    expect(result.diagnostics).toEqual([]);
    expect(result.blocks).toEqual([
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: '这里 ' },
          { type: 'stemLine' },
          { type: 'text', text: ' 应该选 ' },
          { type: 'choiceParenRef' },
        ],
      },
    ]);
    expect(stringifyRichContentBlocks(result.blocks)).toBe('这里 {{横线}} 应该选 {{选择括号}}');
  });

  it('keeps duplicate choice parentheses as semantic refs with a diagnostic', () => {
    const result = parseRichContentInput('{{选择括号}} 和 {{选择括号}}', {
      context: 'choiceStem',
    });

    expect(result.blocks).toEqual([
      {
        type: 'paragraph',
        children: [
          { type: 'choiceParenRef' },
          { type: 'text', text: ' 和 ' },
          { type: 'choiceParenRef' },
        ],
      },
    ]);
    expect(result.diagnostics).toEqual([
      {
        code: 'duplicate_choice_paren_placeholder',
        message: '选择题只能有一个选择括号位置。',
      },
    ]);
  });

  it('parses and stringifies judgement placeholders in judgement stems', () => {
    const result = parseRichContentInput('命题 {{判断括号}}', {
      context: 'judgementStem',
    });

    expect(result.diagnostics).toEqual([]);
    expect(result.blocks).toEqual([
      {
        type: 'paragraph',
        children: [{ type: 'text', text: '命题 ' }, { type: 'judgementRef' }],
      },
    ]);
    expect(stringifyRichContentBlocks(result.blocks)).toBe('命题 {{判断括号}}');
  });

  it('diagnoses duplicate and misplaced judgement placeholders', () => {
    const duplicate = parseRichContentInput('{{判断括号}} 与 {{判断括号}}', {
      context: 'judgementStem',
    });
    const misplaced = parseRichContentInput('{{判断括号}}', { context: 'blankStem' });

    expect(duplicate.diagnostics).toEqual([
      {
        code: 'duplicate_judgement_placeholder',
        message: '判断题只能有一个判断括号位置。',
      },
    ]);
    expect(misplaced.diagnostics).toEqual([
      {
        code: 'invalid_placeholder_context',
        message: '判断括号占位只能用于判断题题干。',
      },
    ]);
  });

  it('removes choice parenthesis refs without changing other rich content', () => {
    const blocks = parseRichContentInput('题干 {{选择括号}} 后文\n\n$$x=1$$', {
      context: 'choiceStem',
    }).blocks;

    expect(removeChoiceParenRefs(blocks)).toEqual([
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: '题干 ' },
          { type: 'text', text: ' 后文' },
        ],
      },
      { type: 'displayMath', latex: 'x=1' },
    ]);
  });

  it('warns when placeholders are used in the wrong context', () => {
    const result = parseRichContentInput('选项里 {{选择括号}} 和 {{第1空}}', {
      blankIds: ['blank-1'],
      context: 'choiceOption',
    });

    expect(result.blocks).toEqual([
      {
        type: 'paragraph',
        children: [{ type: 'text', text: '选项里 {{选择括号}} 和 {{第1空}}' }],
      },
    ]);
    expect(result.diagnostics).toEqual([
      {
        code: 'invalid_placeholder_context',
        message: '选择括号占位只能用于单选题或多选题题干。',
      },
      {
        code: 'invalid_placeholder_context',
        message: '填空占位符只能用于填空题题干。',
      },
    ]);
  });

  it('keeps unclosed inline math as text with a diagnostic', () => {
    const result = parseRichContentInput('这里有 $x+1');

    expect(result.blocks).toEqual([
      {
        type: 'paragraph',
        children: [{ type: 'text', text: '这里有 $x+1' }],
      },
    ]);
    expect(result.diagnostics).toEqual([
      {
        code: 'unclosed_inline_math',
        message: '行内公式缺少结束的 "$"，已按普通文本保留。',
      },
    ]);
  });

  it('keeps unknown blank placeholders as text with a diagnostic', () => {
    const result = parseRichContentInput('答案是 {{第2空}}', {
      blankIds: ['blank-1'],
    });

    expect(result.blocks).toEqual([
      {
        type: 'paragraph',
        children: [{ type: 'text', text: '答案是 {{第2空}}' }],
      },
    ]);
    expect(result.diagnostics).toEqual([
      {
        code: 'unknown_blank_placeholder',
        message: '填空占位符“{{第2空}}”没有对应的填空项。',
      },
    ]);
  });

  it('keeps unknown placeholders as text with a diagnostic', () => {
    const result = parseRichContentInput('这里有 {{未知}}');

    expect(result.blocks).toEqual([
      {
        type: 'paragraph',
        children: [{ type: 'text', text: '这里有 {{未知}}' }],
      },
    ]);
    expect(result.diagnostics).toEqual([
      {
        code: 'unknown_placeholder',
        message: '占位符“{{未知}}”暂不支持。',
      },
    ]);
  });

  it('removes judgement references recursively without changing other rich content', () => {
    const blocks = [
      {
        type: 'list' as const,
        kind: 'enumerate' as const,
        items: [
          [
            {
              type: 'textFigure' as const,
              text: [
                {
                  type: 'paragraph' as const,
                  children: [
                    { type: 'text' as const, text: '命题' },
                    { type: 'judgementRef' as const },
                    { type: 'inlineMath' as const, latex: 'x=1' },
                  ],
                },
              ],
              figure: { type: 'image' as const, assetId: 'asset-1' },
            },
          ],
        ],
      },
    ];

    expect(removeJudgementRefs(blocks)).toEqual([
      {
        type: 'list',
        kind: 'enumerate',
        items: [
          [
            {
              type: 'textFigure',
              text: [
                {
                  type: 'paragraph',
                  children: [
                    { type: 'text', text: '命题' },
                    { type: 'inlineMath', latex: 'x=1' },
                  ],
                },
              ],
              figure: { type: 'image', assetId: 'asset-1' },
            },
          ],
        ],
      },
    ]);
  });
});
