import { describe, expect, it } from 'vitest';

import {
  buildReferenceContextSummary,
  collectAnnotationReferenceIds,
  collectScoreReferenceIds,
  insertTeacherReferenceAtSelection,
  isScoreLevelOrderDescending,
  moveScoreMarkToSummary,
  parseTeacherSolutionInput,
  reconcileTeacherSolutionBlocks,
  sortScoreLevelsDescending,
  stringifyInlineRichText,
} from './teacher-content';
import { stringifyRichContentBlocks } from './rich-content';

describe('teacher solution content', () => {
  it('converts numeric score commands and textual annotations in place', () => {
    const result = parseTeacherSolutionInput({
      input: '先完成化简 \\score{2}，再说明 \\score{关键步骤}，最后验证 \\score{$x=1$}。',
      createId: sequenceIdFactory(),
    });

    expect(result.conversions).toEqual({ scoreMarks: 1, annotations: 2 });
    expect(result.diagnostics).toEqual([]);
    expect(result.scoreMarks).toEqual([
      expect.objectContaining({ id: 'score-1', points: 2, placement: 'inline' }),
    ]);
    expect(result.annotations.map((item) => stringifyInlineRichText(item.content))).toEqual([
      '关键步骤',
      '$x=1$',
    ]);
    expect(collectScoreReferenceIds(result.solution)).toEqual(['score-1']);
    expect(collectAnnotationReferenceIds(result.solution)).toEqual([
      'annotation-2',
      'annotation-3',
    ]);
    expect(
      stringifyRichContentBlocks(result.solution, [], {
        scoreMarks: result.scoreMarks,
        annotations: result.annotations,
      }),
    ).toBe('先完成化简 \\score{2}，再说明 \\score{关键步骤}，最后验证 \\score{$x=1$}。');
  });

  it('reuses ids across repeated submissions and same-kind edits', () => {
    const createId = sequenceIdFactory();
    const first = parseTeacherSolutionInput({
      input: '步骤 \\score{2}，说明 \\score{关键点}。',
      createId,
    });
    const second = parseTeacherSolutionInput({
      input: '步骤 \\score{3}，说明 \\score{核心结论}。',
      solution: first.solution,
      scoreMarks: first.scoreMarks,
      annotations: first.annotations,
      createId,
    });

    expect(second.conversions).toEqual({ scoreMarks: 0, annotations: 0 });
    expect(second.scoreMarks).toEqual([
      expect.objectContaining({ id: 'score-1', points: 3, placement: 'inline' }),
    ]);
    expect(second.annotations).toEqual([expect.objectContaining({ id: 'annotation-2' })]);
    expect(stringifyInlineRichText(second.annotations[0]?.content)).toBe('核心结论');
  });

  it('preserves the old object when a command changes semantic kind', () => {
    const createId = sequenceIdFactory();
    const first = parseTeacherSolutionInput({ input: '结论 \\score{2}', createId });
    const second = parseTeacherSolutionInput({
      input: '结论 \\score{需要说明符号方向}',
      solution: first.solution,
      scoreMarks: first.scoreMarks,
      annotations: first.annotations,
      createId,
    });

    expect(second.scoreMarks).toEqual(first.scoreMarks);
    expect(collectScoreReferenceIds(second.solution)).toEqual([]);
    expect(second.annotations).toHaveLength(1);
    expect(collectAnnotationReferenceIds(second.solution)).toEqual(['annotation-2']);
    expect(second.conversions).toEqual({ scoreMarks: 0, annotations: 1 });
  });

  it('removes only references when commands disappear from the solution', () => {
    const createId = sequenceIdFactory();
    const first = parseTeacherSolutionInput({
      input: '步骤 \\score{2}，批注 \\score{关键点}。',
      createId,
    });
    const second = parseTeacherSolutionInput({
      input: '步骤完成，批注另见评分方案。',
      solution: first.solution,
      scoreMarks: first.scoreMarks,
      annotations: first.annotations,
      createId,
    });

    expect(second.scoreMarks).toEqual(first.scoreMarks);
    expect(second.annotations).toEqual(first.annotations);
    expect(collectScoreReferenceIds(second.solution)).toEqual([]);
    expect(collectAnnotationReferenceIds(second.solution)).toEqual([]);
  });

  it('leaves unsupported score forms and math-environment commands untouched', () => {
    const result = parseTeacherSolutionInput({
      input: [
        '$\\score{2}$',
        '\\scoreboard{2}',
        '\\score[red]{2}',
        '\\score{-1}',
        '\\score{}',
        '\\score',
      ].join(' '),
      createId: sequenceIdFactory(),
    });

    expect(result.scoreMarks).toEqual([]);
    expect(result.annotations).toEqual([]);
    expect(result.diagnostics.map((item) => item.code)).toEqual([
      'advanced_score_command',
      'negative_score_command',
      'empty_score_command',
      'malformed_score_command',
    ]);
    expect(stringifyRichContentBlocks(result.solution)).toContain('$\\score{2}$');
    expect(stringifyRichContentBlocks(result.solution)).toContain('\\scoreboard{2}');
    expect(stringifyRichContentBlocks(result.solution)).toContain('\\score[red]{2}');
  });

  it('does not scan raw LaTeX blocks during migration reconciliation', () => {
    const result = reconcileTeacherSolutionBlocks({
      blocks: [{ type: 'rawLatex', latex: '\\score{4}' }],
      createId: sequenceIdFactory(),
    });

    expect(result.solution).toEqual([{ type: 'rawLatex', latex: '\\score{4}' }]);
    expect(result.scoreMarks).toEqual([]);
  });

  it('builds reference context and performs a stable score-level sort', () => {
    const createId = sequenceIdFactory();
    const result = parseTeacherSolutionInput({
      input: '由条件可得 \\score{2}，所以结论成立。',
      createId,
    });
    expect(
      buildReferenceContextSummary(result.solution, {
        type: 'scoreRef',
        scoreMarkId: 'score-1',
      }),
    ).toContain('由条件可得');

    const levels = [
      { id: 'low', points: 2 },
      { id: 'high-a', points: 4 },
      { id: 'high-b', points: 4 },
    ];
    expect(isScoreLevelOrderDescending(levels)).toBe(false);
    expect(sortScoreLevelsDescending(levels).map((item) => item.id)).toEqual([
      'high-a',
      'high-b',
      'low',
    ]);
  });

  it('reinserts the exact missing score or annotation at the selected text position', () => {
    const createId = sequenceIdFactory();
    const first = parseTeacherSolutionInput({
      input: '第一步 \\score{4}，第二步 \\score{关键结论}。',
      createId,
    });
    const withoutReferences = parseTeacherSolutionInput({
      input: '第一步，第二步。',
      solution: first.solution,
      scoreMarks: first.scoreMarks,
      annotations: first.annotations,
      createId,
    });

    const scoreResult = insertTeacherReferenceAtSelection({
      solution: withoutReferences.solution,
      scoreMarks: withoutReferences.scoreMarks,
      annotations: withoutReferences.annotations,
      reference: { type: 'scoreRef', scoreMarkId: first.scoreMarks[0]!.id },
      selection: { start: 3, end: 7 },
      createId,
    });
    const scoreSource = stringifyRichContentBlocks(scoreResult.solution, [], {
      scoreMarks: scoreResult.scoreMarks,
      annotations: scoreResult.annotations,
    });
    const annotationPosition = scoreSource.indexOf('第二步');
    const annotationResult = insertTeacherReferenceAtSelection({
      solution: scoreResult.solution,
      scoreMarks: scoreResult.scoreMarks,
      annotations: scoreResult.annotations,
      reference: { type: 'annotationRef', annotationId: first.annotations[0]!.id },
      selection: { start: annotationPosition, end: annotationPosition },
      createId,
    });

    expect(annotationResult.scoreMarks).toHaveLength(1);
    expect(annotationResult.annotations).toHaveLength(1);
    expect(collectScoreReferenceIds(annotationResult.solution)).toEqual([first.scoreMarks[0]!.id]);
    expect(collectAnnotationReferenceIds(annotationResult.solution)).toEqual([
      first.annotations[0]!.id,
    ]);
    const finalSource = stringifyRichContentBlocks(annotationResult.solution, [], {
      scoreMarks: annotationResult.scoreMarks,
      annotations: annotationResult.annotations,
    });
    expect(finalSource).toContain('第一步 \\score{4}，');
    expect(finalSource).toContain('\\score{关键结论}第二步。');
    expect(annotationResult.scoreMarks[0]?.placement).toBe('inline');
  });

  it('converts a lost inline score to the sparse summary placement', () => {
    const scoreMarks = [
      { id: 'score-inline', points: 4, placement: 'inline' as const },
      { id: 'score-summary', points: 0 },
    ];
    const result = moveScoreMarkToSummary(scoreMarks, 'score-inline');

    expect(result).toEqual([
      { id: 'score-inline', points: 4, placement: undefined },
      scoreMarks[1],
    ]);
    expect(scoreMarks[0]?.placement).toBe('inline');
  });
});

function sequenceIdFactory() {
  let nextId = 1;
  return (prefix: string) => `${prefix}-${nextId++}`;
}
