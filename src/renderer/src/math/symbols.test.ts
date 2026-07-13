import { describe, expect, it } from 'vitest';

import {
  findMathSnippet,
  formatMathSnippetTooltip,
  frequentMathSnippetIds,
  getMathSnippetGroupsForTab,
  getVisibleMathSnippetTabs,
  insertMathSnippetAtSelection,
  insertTextAtSelection,
  isMathPreviewSnippet,
  mathSnippetCategories,
  mathSnippetRegistry,
  recentMathSnippetLimit,
  moveMathSnippetSlot,
  updateMathSnippetSlotStateForEdit,
  updateRecentMathSnippetIds,
} from './symbols';

describe('math snippet registry', () => {
  it('keeps snippet ids unique', () => {
    const ids = mathSnippetRegistry.map((snippet) => snippet.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps category ids unique and registers every snippet category', () => {
    const categoryIds = mathSnippetCategories.map((category) => category.id);
    const registeredCategoryIds = new Set(categoryIds);

    expect(new Set(categoryIds).size).toBe(categoryIds.length);
    for (const snippet of mathSnippetRegistry) {
      expect(registeredCategoryIds.has(snippet.category)).toBe(true);
    }
  });

  it('keeps stable insertion text for representative snippets', () => {
    expect(findMathSnippet('frac')?.insertText).toBe('$\\frac{}{}$');
    expect(findMathSnippet('dfrac')?.insertText).toBe('$\\dfrac{}{}$');
    expect(findMathSnippet('auto-paren')?.insertText).toBe('$\\left(\\right)$');
    expect(findMathSnippet('auto-bracket')?.insertText).toBe('$\\left[\\right]$');
    expect(findMathSnippet('auto-brace')?.insertText).toBe('$\\left\\{\\right\\}$');
    expect(findMathSnippet('abs')?.insertText).toBe('$\\left|\\right|$');
    expect(findMathSnippet('sup')?.insertText).toBe('${}^{}$');
    expect(findMathSnippet('sub')?.insertText).toBe('${}_{}$');
    expect(findMathSnippet('euler')?.insertText).toBe('$\\eu^{\\iu x}$');
    expect(findMathSnippet('vec-single')?.insertText).toBe('$\\vec{}$');
    expect(findMathSnippet('vec-multi')?.insertText).toBe('$\\vec{}$');
    expect(findMathSnippet('parallelogram')?.insertText).toBe('$\\parallelogram$');
    expect(findMathSnippet('paralleleq')?.insertText).toBe('$\\paralleleq$');
    expect(findMathSnippet('nsubsetneqq')?.insertText).toBe('$\\nsubsetneqq$');
    expect(findMathSnippet('nsupsetneqq')?.insertText).toBe('$\\nsupsetneqq$');
    expect(findMathSnippet('subset')?.insertText).toBe('$\\subset*$');
    expect(findMathSnippet('examzh-subset')?.insertText).toBe('$\\subset$');
    expect(findMathSnippet('cap')?.insertText).toBe('$\\cap*$');
    expect(findMathSnippet('examzh-cap')?.insertText).toBe('$\\cap$');
    expect(findMathSnippet('paren')?.insertText).toBe('{{选择括号}}');
    expect(findMathSnippet('judgement-paren')?.insertText).toBe('{{判断括号}}');
    expect(findMathSnippet('stem-line')?.insertText).toBe('{{横线}}');
    expect(findMathSnippet('fillin-ref')?.insertText).toBe('{{第1空}}');
  });

  it('uses readable preview examples without changing insertion templates', () => {
    expect(findMathSnippet('frac')).toMatchObject({
      insertText: '$\\frac{}{}$',
      previewLatex: '\\frac{a}{b}',
    });
    expect(findMathSnippet('sqrt')).toMatchObject({
      insertText: '$\\sqrt{}$',
      previewLatex: '\\sqrt{x}',
    });
    expect(findMathSnippet('sup')).toMatchObject({
      insertText: '${}^{}$',
      previewLatex: 'x^2',
    });
    expect(findMathSnippet('sub')).toMatchObject({
      insertText: '${}_{}$',
      previewLatex: 'x_i',
    });
    expect(findMathSnippet('vec-single')).toMatchObject({
      insertText: '$\\vec{}$',
      previewLatex: '\\boldsymbol{x}',
    });
    expect(findMathSnippet('vec-multi')).toMatchObject({
      insertText: '$\\vec{}$',
      previewLatex: '\\overrightarrow{AB}',
    });
    for (const snippetId of ['auto-paren', 'auto-bracket', 'auto-brace']) {
      expect(findMathSnippet(snippetId)?.previewLatex).toContain('\\vphantom');
    }
    expect(findMathSnippet('parallelogram')).toMatchObject({
      insertText: '$\\parallelogram$',
      previewLatex: '\\parallelogram',
    });
    expect(findMathSnippet('paralleleq')).toMatchObject({
      insertText: '$\\paralleleq$',
      previewLatex: '\\paralleleq',
    });
    expect(findMathSnippet('subset')).toMatchObject({
      insertText: '$\\subset*$',
      previewLatex: '\\subset',
    });
    expect(findMathSnippet('examzh-subset')).toMatchObject({
      insertText: '$\\subset$',
      previewLatex: '\\subset',
    });
  });

  it('keeps exam-zh aliases structured for upright constants', () => {
    expect(findMathSnippet('eu')?.aliases).toEqual(['\\upe']);
    expect(findMathSnippet('iu')?.aliases).toEqual(['\\upi']);
    expect(formatMathSnippetTooltip(findMathSnippet('eu')!)).toContain('等价命令：\\upe');
  });

  it('uses teacher-facing semantic categories for representative snippets', () => {
    expect(findMathSnippet('pi')?.category).toBe('constant');
    expect(findMathSnippet('eu')?.category).toBe('constant');
    expect(findMathSnippet('iu')?.category).toBe('complex');
    expect(findMathSnippet('euler')?.category).toBe('complex');
    expect(findMathSnippet('sin')?.category).toBe('function');
  });

  it('orders source tabs by the category registry instead of declaration order', () => {
    expect(getMathSnippetGroupsForTab('standardLatex').map((group) => group.category)).toEqual([
      'relation',
      'structure',
      'setLogic',
      'geometry',
      'function',
      'calculus',
    ]);
    expect(getMathSnippetGroupsForTab('examZhMath').map((group) => group.category)).toEqual([
      'relation',
      'setLogic',
      'geometry',
      'constant',
      'complex',
    ]);
  });

  it('keeps frequent snippets flat and in curated order', () => {
    expect(flattenTabSnippetIds('frequent')).toEqual([...frequentMathSnippetIds]);
  });

  it('registers localized exam-zh math symbols from manual 3.4.3', () => {
    const localizedSnippetIds = [
      'parallelogram',
      'parallel',
      'nparallel',
      'paralleleq',
      'examzh-subset',
      'nsubset',
      'subseteq',
      'nsubseteq',
      'subsetneqq',
      'nsubsetneqq',
      'supset',
      'nsupset',
      'supseteq',
      'nsupseteq',
      'supsetneqq',
      'examzh-cap',
      'examzh-cup',
      'nsupsetneqq',
      'sim',
      'nsim',
      'cong',
      'ncong',
    ];

    expect(flattenTabSnippetIds('examZhMath')).toEqual(expect.arrayContaining(localizedSnippetIds));
    for (const snippetId of localizedSnippetIds) {
      expect(findMathSnippet(snippetId)).toMatchObject({
        source: 'examZhMath',
        manualRef: '3.4.3',
      });
    }
  });

  it('keeps starred original versions in the standard LaTeX tab when upstream provides them', () => {
    expect(flattenTabSnippetIds('standardLatex')).toEqual(
      expect.arrayContaining([
        'subset',
        'nsubset-standard',
        'subseteq-standard',
        'nsubseteq-standard',
        'subsetneqq-standard',
        'supset-standard',
        'nsupset-standard',
        'supseteq-standard',
        'nsupseteq-standard',
        'supsetneqq-standard',
        'cap',
        'cup',
        'sim-standard',
        'cong-standard',
      ]),
    );
    expect(findMathSnippet('subset')?.insertText).toBe('$\\subset*$');
    expect(findMathSnippet('cap')?.insertText).toBe('$\\cap*$');
    expect(findMathSnippet('sim-standard')?.insertText).toBe('$\\sim*$');
    expect(findMathSnippet('cong-standard')?.insertText).toBe('$\\cong*$');
    expect(findMathSnippet('parallel')?.source).toBe('examZhMath');
  });

  it('filters tabs by snippet source', () => {
    expect(flattenTabSources('standardLatex')).toEqual(['standardLatex']);
    expect(flattenTabSources('examZhMath')).toEqual(['examZhMath']);
    expect(flattenTabSources('examZhPaper')).toEqual(['appPlaceholder', 'examZhPaper']);
  });

  it('requires preview LaTeX only for math snippets', () => {
    for (const snippet of mathSnippetRegistry) {
      if (snippet.source === 'standardLatex' || snippet.source === 'examZhMath') {
        expect(snippet.previewLatex).toBeTypeOf('string');
        expect(isMathPreviewSnippet(snippet)).toBe(true);
      } else {
        expect(isMathPreviewSnippet(snippet)).toBe(false);
      }
    }
  });

  it('shows the recent tab only after snippets are used', () => {
    expect(getVisibleMathSnippetTabs().map((tab) => tab.id)).not.toContain('recent');
    expect(getVisibleMathSnippetTabs(['frac']).map((tab) => tab.id)[0]).toBe('recent');
  });

  it('filters paper snippets by editing context', () => {
    expect(flattenTabSnippetIds('examZhPaper', 'choiceStem')).toEqual(['paren', 'stem-line']);
    expect(flattenTabSnippetIds('examZhPaper', 'blankStem')).toEqual(['fillin-ref', 'stem-line']);
    expect(flattenTabSnippetIds('examZhPaper', 'judgementStem')).toEqual(['judgement-paren']);
    expect(flattenTabSnippetIds('examZhPaper', 'choiceOption')).toEqual([]);
    expect(flattenTabSnippetIds('examZhPaper', 'blankAnswer')).toEqual([]);
    expect(flattenTabSnippetIds('examZhPaper', 'solution')).toEqual(['score']);
  });
});

describe('recent math snippets', () => {
  it('deduplicates and moves the latest snippet to the front', () => {
    expect(updateRecentMathSnippetIds(['frac', 'sqrt'], 'frac')).toEqual(['frac', 'sqrt']);
    expect(updateRecentMathSnippetIds(['frac', 'sqrt'], 'eu')).toEqual(['eu', 'frac', 'sqrt']);
  });

  it('limits the recent list to twelve snippets', () => {
    const snippetIds = mathSnippetRegistry
      .slice(0, recentMathSnippetLimit)
      .map((snippet) => snippet.id);
    const next = updateRecentMathSnippetIds(snippetIds, 'euler');

    expect(next).toHaveLength(recentMathSnippetLimit);
    expect(next[0]).toBe('euler');
  });

  it('ignores unknown snippet ids', () => {
    expect(updateRecentMathSnippetIds(['frac'], 'missing-snippet')).toEqual(['frac']);
  });

  it('filters recent snippets by editing context', () => {
    expect(
      getVisibleMathSnippetTabs(['fillin-ref'], 'choiceStem').map((tab) => tab.id),
    ).not.toContain('recent');
    expect(flattenTabSnippetIds('recent', 'choiceStem', ['fillin-ref', 'paren', 'frac'])).toEqual([
      'paren',
      'frac',
    ]);
  });

  it('keeps recency order across semantic categories', () => {
    const recentIds = ['pi', 'frac', 'parallel', 'eu'];

    expect(flattenTabSnippetIds('recent', undefined, recentIds)).toEqual(recentIds);
  });
});

describe('insertTextAtSelection', () => {
  it('inserts in the middle of text', () => {
    expect(insertTextAtSelection('函数 值', '$x^2$', { start: 3, end: 3 })).toEqual({
      value: '函数 $x^2$值',
      selectionStart: 8,
      selectionEnd: 8,
    });
  });

  it('replaces selected text', () => {
    expect(insertTextAtSelection('函数 x 值', '$x^2$', { start: 3, end: 4 })).toEqual({
      value: '函数 $x^2$ 值',
      selectionStart: 8,
      selectionEnd: 8,
    });
  });

  it('appends when no selection is available', () => {
    expect(insertTextAtSelection('答案：', '$\\sqrt{}$')).toEqual({
      value: '答案：$\\sqrt{}$',
      selectionStart: 12,
      selectionEnd: 12,
    });
  });

  it('clamps selection bounds', () => {
    expect(insertTextAtSelection('abc', 'X', { start: -10, end: 99 })).toEqual({
      value: 'X',
      selectionStart: 1,
      selectionEnd: 1,
    });
  });
});

describe('structured math snippet insertion', () => {
  it('wraps ordinary text selections in one inline math environment', () => {
    const snippet = findMathSnippet('auto-paren')!;
    const result = insertMathSnippetAtSelection('函数 x+1 的值', snippet, {
      start: 3,
      end: 6,
    });

    expect(result.value).toBe('函数 $\\left(x+1\\right)$ 的值');
    expect(result.value.slice(result.selectionStart, result.selectionEnd)).toBe('x+1');
  });

  it('does not duplicate delimiters inside or around a complete inline formula', () => {
    const snippet = findMathSnippet('auto-bracket')!;
    const inside = insertMathSnippetAtSelection('结果 $x+1$。', snippet, {
      start: 4,
      end: 7,
    });
    const complete = insertMathSnippetAtSelection('函数 $x+1$', snippet, {
      start: 3,
      end: 8,
    });

    expect(inside.value).toBe('结果 $\\left[x+1\\right]$。');
    expect(complete.value).toBe('函数 $\\left[x+1\\right]$');
  });

  it('uses a selected expression as the first fraction slot and focuses the second', () => {
    const result = insertMathSnippetAtSelection('令 a+b', findMathSnippet('dfrac')!, {
      start: 2,
      end: 5,
    });

    expect(result.value).toBe('令 $\\dfrac{a+b}{}$');
    expect(result.slotState?.activeIndex).toBe(1);
    expect(result.selectionStart).toBe(result.selectionEnd);
  });

  it('registers five selection-aware wrappers', () => {
    for (const snippetId of ['sqrt', 'auto-paren', 'auto-bracket', 'auto-brace', 'abs']) {
      expect(findMathSnippet(snippetId)?.insertion).toMatchObject({ kind: 'wrapper' });
    }
  });

  it('uses base and script slots for superscripts and subscripts', () => {
    const emptySuperscript = insertMathSnippetAtSelection('', findMathSnippet('sup')!);
    const superscript = insertMathSnippetAtSelection('变量 x', findMathSnippet('sup')!, {
      start: 3,
      end: 4,
    });
    const subscript = insertMathSnippetAtSelection('变量 $a$', findMathSnippet('sub')!, {
      start: 3,
      end: 6,
    });

    expect(emptySuperscript.value).toBe('${}^{}$');
    expect(emptySuperscript.slotState?.activeIndex).toBe(0);
    expect(moveMathSnippetSlot(emptySuperscript.slotState!, 'next').slotState?.activeIndex).toBe(1);
    expect(superscript.value).toBe('变量 ${x}^{}$');
    expect(superscript.slotState?.activeIndex).toBe(1);
    expect(subscript.value).toBe('变量 ${a}_{}$');
    expect(subscript.slotState?.activeIndex).toBe(1);
  });

  it('wraps selected single- and multi-letter vector content', () => {
    const empty = insertMathSnippetAtSelection('', findMathSnippet('vec-single')!);
    const single = insertMathSnippetAtSelection('向量 x', findMathSnippet('vec-single')!, {
      start: 3,
      end: 4,
    });
    const multi = insertMathSnippetAtSelection('向量 $AB$', findMathSnippet('vec-multi')!, {
      start: 3,
      end: 7,
    });

    expect(empty.value).toBe('$\\vec{}$');
    expect(empty.slotState?.activeIndex).toBe(0);
    expect(single.value).toBe('向量 $\\vec{x}$');
    expect(single.value.slice(single.selectionStart, single.selectionEnd)).toBe('x');
    expect(multi.value).toBe('向量 $\\vec{AB}$');
    expect(multi.value.slice(multi.selectionStart, multi.selectionEnd)).toBe('AB');
  });

  it('navigates fraction slots and keeps later ranges aligned while typing', () => {
    const inserted = insertMathSnippetAtSelection('答案：', findMathSnippet('frac')!);
    const firstState = inserted.slotState!;
    const firstSlot = firstState.slots[0]!;
    const withNumerator = `${inserted.value.slice(0, firstSlot.start)}a+b${inserted.value.slice(firstSlot.end)}`;
    const shiftedState = updateMathSnippetSlotStateForEdit(
      firstState,
      inserted.value,
      withNumerator,
    )!;
    const next = moveMathSnippetSlot(shiftedState, 'next');

    expect(withNumerator).toBe('答案：$\\frac{a+b}{}$');
    expect(next.slotState?.activeIndex).toBe(1);
    expect(withNumerator.slice(next.selection.start, next.selection.end)).toBe('');

    const previous = moveMathSnippetSlot(next.slotState!, 'previous');
    expect(withNumerator.slice(previous.selection.start, previous.selection.end)).toBe('a+b');

    const exited = moveMathSnippetSlot(next.slotState!, 'next');
    expect(exited.slotState).toBeUndefined();
    expect(exited.selection.start).toBe(withNumerator.length);
  });

  it('clears slot navigation when an edit escapes the active slot', () => {
    const inserted = insertMathSnippetAtSelection('', findMathSnippet('frac')!);
    expect(
      updateMathSnippetSlotStateForEdit(inserted.slotState!, inserted.value, `前${inserted.value}`),
    ).toBeUndefined();
  });
});

function flattenTabSources(tabId: 'standardLatex' | 'examZhMath' | 'examZhPaper') {
  return [
    ...new Set(
      getMathSnippetGroupsForTab(tabId).flatMap((group) =>
        group.snippets.map((snippet) => snippet.source),
      ),
    ),
  ].sort();
}

function flattenTabSnippetIds(
  tabId: 'recent' | 'frequent' | 'standardLatex' | 'examZhMath' | 'examZhPaper',
  context?: Parameters<typeof getMathSnippetGroupsForTab>[2],
  recentSnippetIds: string[] = [],
) {
  return getMathSnippetGroupsForTab(tabId, recentSnippetIds, context).flatMap((group) =>
    group.snippets.map((snippet) => snippet.id),
  );
}
