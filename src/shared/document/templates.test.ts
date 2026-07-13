import { describe, expect, it } from 'vitest';

import { exportExamDocumentToTex } from '../export/exam-zh';
import { calculateDocumentStats } from './editor';
import { parseExamDocument } from './schema';
import { deserializeExamDocument, serializeExamDocument } from './serialization';
import {
  createExamDocumentFromTemplate,
  examDocumentTemplates,
  type ExamDocumentTemplateId,
} from './templates';
import type { ExamDocument } from './model';

const expectedTemplateIds: ExamDocumentTemplateId[] = [
  'blank-math',
  'math-quiz',
  'math-basic',
  'math-teacher',
  'math-showcase',
  'math-full-exam',
];

describe('built-in exam document templates', () => {
  it('keeps a stable, categorized registry with useful descriptions', () => {
    expect(examDocumentTemplates.map((template) => template.id)).toEqual(expectedTemplateIds);
    expect(examDocumentTemplates.map((template) => template.category)).toEqual([
      'starter',
      'starter',
      'starter',
      'example',
      'example',
      'example',
    ]);
    expect(new Set(examDocumentTemplates.map((template) => template.id)).size).toBe(
      examDocumentTemplates.length,
    );
    expect(examDocumentTemplates.every((template) => template.name && template.description)).toBe(
      true,
    );
  });

  it.each(expectedTemplateIds)('creates a strict round-trippable %s document', (templateId) => {
    const document = createExamDocumentFromTemplate(templateId, sequenceIdFactory());
    const parsed = parseExamDocument(document);

    expectScoreOwnersToHaveExplicitModes(document);
    expect(deserializeExamDocument(serializeExamDocument(parsed))).toEqual(parsed);
    expect(exportExamDocumentToTex(parsed).diagnostics).toEqual([]);
  });

  it.each(expectedTemplateIds)(
    'creates fresh internal ids for repeated %s documents',
    (templateId) => {
      const createId = globalSequenceIdFactory();
      const first = createExamDocumentFromTemplate(templateId, createId);
      const second = createExamDocumentFromTemplate(templateId, createId);
      const firstIds = collectDocumentIds(first);
      const secondIds = collectDocumentIds(second);

      expect(firstIds.size).toBe(countDocumentIds(first));
      expect(secondIds.size).toBe(countDocumentIds(second));
      expect([...firstIds].filter((id) => secondIds.has(id))).toEqual([]);
      expectChoiceAnswersReferenceExistingOptions(first);
      expectChoiceAnswersReferenceExistingOptions(second);
    },
  );

  it('creates starter templates without placeholder questions or misleading totals', () => {
    const blank = createExamDocumentFromTemplate('blank-math', sequenceIdFactory());
    const quiz = createExamDocumentFromTemplate('math-quiz', sequenceIdFactory());
    const standard = createExamDocumentFromTemplate('math-basic', sequenceIdFactory());

    expect(blank.sections).toEqual([]);
    expect(blank.metadata.totalPoints).toBeUndefined();
    expect(blank.frontMatter.informationFields).toEqual([]);
    expect(blank.setup.examZhOptions).toBeUndefined();

    expect(quiz.sections.map((section) => section.kind)).toEqual([
      'singleChoice',
      'blank',
      'problem',
    ]);
    expect(quiz.sections.every((section) => section.questions.length === 0)).toBe(true);
    expect(quiz.metadata.totalPoints).toBeUndefined();
    expect(quiz.frontMatter.informationPlacement).toBe('belowSubject');
    expect(quiz.frontMatter.informationFields.map((field) => field.label)).toEqual([
      '姓名：',
      '班级：',
    ]);
    expect(quiz.setup.fillin?.examZhOptions).toEqual({ 'no-answer-type': 'none' });
    expect(exportExamDocumentToTex(quiz).tex).toContain('fillin/no-answer-type = none');

    expect(standard.sections.every((section) => section.questions.length === 0)).toBe(true);
    expect(standard.metadata.totalPoints).toBeUndefined();
    expect(standard.frontMatter.secret).toBe(true);
    expect(standard.frontMatter.notices).toHaveLength(2);
    expect(standard.setup.fillin).toBeUndefined();
    expect(exportExamDocumentToTex(standard).tex).not.toContain('fillin/no-answer-type');
  });

  it('keeps the teacher example internally complete and score-consistent', () => {
    const document = createExamDocumentFromTemplate('math-teacher', sequenceIdFactory());
    const questions = document.sections.flatMap((section) => section.questions);

    expect(document.setup.answerMode).toBe('teacher');
    expect(document.setup.examZhOptions?.['paren/text-color']).toBe('red');
    expect(calculateDocumentStats(document).totalPoints).toBe(document.metadata.totalPoints);
    expect(questions).toHaveLength(3);
    expect(questions.every((question) => (question.solution?.length ?? 0) > 0)).toBe(true);
    expect(questions.every((question) => hasTeacherScoring(question))).toBe(true);
    expect(
      questions.find((question) => question.type === 'blank')?.blanks?.[0]?.answer,
    ).toBeTruthy();
  });

  it('covers the current structured workflow in the comprehensive example', () => {
    const document = createExamDocumentFromTemplate('math-showcase', sequenceIdFactory());
    const questions = document.sections.flatMap((section) => section.questions);
    const types = questions.map((question) => question.type);
    const singleChoice = questions.find((question) => question.type === 'singleChoice');
    const multipleChoice = questions.find((question) => question.type === 'multipleChoice');
    const blank = questions.find((question) => question.type === 'blank');
    const judgements = questions.filter((question) => question.type === 'judgement');
    const problem = questions.find((question) => question.type === 'problem');

    expect(types).toEqual([
      'singleChoice',
      'multipleChoice',
      'blank',
      'judgement',
      'judgement',
      'problem',
    ]);
    expect(document.metadata.totalPoints).toBe(34);
    expect(calculateDocumentStats(document).totalPoints).toBe(34);
    expect(document.frontMatter.warning).toBeTruthy();
    expect(document.frontMatter.notices).toHaveLength(2);
    expect(document.setup.choices?.maxColumns).toBe(2);
    expect(document.setup.judgement?.answerColor).toBe('red');
    expect(
      singleChoice?.stem[0]?.type === 'paragraph' ? singleChoice.stem[0].children : [],
    ).toContainEqual({ type: 'choiceParenRef' });
    expect(multipleChoice?.choicesSetup?.examZhOptions?.label).toBe('\\circlednumber*');
    expect(
      multipleChoice?.solution?.some(
        (block) =>
          block.type === 'paragraph' && block.children.some((child) => child.type === 'inlineMath'),
      ),
    ).toBe(true);
    expect(blank?.blanks).toHaveLength(2);
    expect(blank?.blanks?.every((slot) => (slot.answer?.length ?? 0) > 0)).toBe(true);
    expect(judgements).toHaveLength(2);
    expect(judgements.map((question) => question.judgement?.correctAnswer)).toEqual([true, false]);
    expect(judgements[1]?.judgement).toMatchObject({
      answerStyle: 'symbol',
      placement: 'inline',
    });
    expect(judgements.every((question) => (question.solution?.length ?? 0) > 0)).toBe(true);
    expect(judgements.every((question) => hasTeacherScoring(question))).toBe(true);
    expect(problem?.subQuestionGroup?.items).toHaveLength(2);
    expect(problem?.subQuestionGroup?.items.every((item) => hasTeacherScoring(item))).toBe(true);
  });
});

function sequenceIdFactory() {
  let nextId = 1;
  return (prefix: string) => `${prefix}-${nextId++}`;
}

function globalSequenceIdFactory() {
  let nextId = 1;
  return (prefix: string) => `${prefix}-global-${nextId++}`;
}

function collectDocumentIds(document: ExamDocument): Set<string> {
  return new Set(iterateDocumentIds(document));
}

function countDocumentIds(document: ExamDocument): number {
  return iterateDocumentIds(document).length;
}

function iterateDocumentIds(document: ExamDocument): string[] {
  return [
    document.documentId,
    ...document.assets.map((asset) => asset.id),
    ...document.sections.flatMap((section) => [
      section.id,
      ...section.questions.flatMap((question) => [
        question.id,
        ...(question.choices ?? []).map((choice) => choice.id),
        ...(question.blanks ?? []).map((blank) => blank.id),
        ...(question.scoreMarks ?? []).map((scoreMark) => scoreMark.id),
        ...(question.solutionAnnotations ?? []).map((annotation) => annotation.id),
        ...(question.subQuestionGroup?.items ?? []).flatMap((item) => [
          item.id,
          ...(item.scoreMarks ?? []).map((scoreMark) => scoreMark.id),
          ...(item.solutionAnnotations ?? []).map((annotation) => annotation.id),
        ]),
      ]),
    ]),
  ];
}

function expectChoiceAnswersReferenceExistingOptions(document: ExamDocument): void {
  for (const question of document.sections.flatMap((section) => section.questions)) {
    const optionIds = new Set((question.choices ?? []).map((choice) => choice.id));

    for (const answerId of question.correctChoiceIds ?? []) {
      expect(optionIds.has(answerId)).toBe(true);
    }
  }
}

function hasTeacherScoring(owner: {
  scoreMarks?: { points: number }[];
  subQuestionGroup?: { items: { scoreMarks?: { points: number }[] }[] };
}): boolean {
  const ownScoreMarks = owner.scoreMarks ?? [];

  if (ownScoreMarks.length > 0) {
    return true;
  }

  return (owner.subQuestionGroup?.items ?? []).every((item) => (item.scoreMarks?.length ?? 0) > 0);
}

function expectScoreOwnersToHaveExplicitModes(document: ExamDocument): void {
  for (const question of document.sections.flatMap((section) => section.questions)) {
    if ((question.scoreMarks?.length ?? 0) > 0) {
      expect(question.scoreMode, question.id).toBeDefined();
    }

    for (const item of question.subQuestionGroup?.items ?? []) {
      if ((item.scoreMarks?.length ?? 0) > 0) {
        expect(item.scoreMode, item.id).toBeDefined();
      }
    }
  }
}
