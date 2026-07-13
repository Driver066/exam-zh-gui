import { describe, expect, it } from 'vitest';

import { exportExamDocumentToTex } from '../export/exam-zh';
import { calculateDocumentStats, reviewQuestionScoreMarks, type CreateId } from './editor';
import type { ExamDocument, ExamQuestion, SubQuestion } from './model';
import { collectAnnotationReferenceIds, collectScoreReferenceIds } from './teacher-content';
import { createExamDocumentFromTemplate } from './templates';

describe('full math exam template', () => {
  it('provides the fixed 4-section, 19-question, 150-point baseline', () => {
    const document = createFullExam();
    const questions = getQuestions(document);

    expect(document.metadata).toMatchObject({
      title: '高中数学完整试卷示例',
      subject: '数学',
      grade: '高三',
      durationMinutes: 120,
      totalPoints: 150,
    });
    expect(document.setup).toMatchObject({
      answerMode: 'teacher',
      choices: { maxColumns: 4 },
      fillin: { answerColor: 'red' },
      examZhOptions: { 'paren/text-color': 'red' },
    });
    expect(document.sections.map((section) => section.questions.length)).toEqual([8, 3, 3, 5]);
    expect(document.sections.map((section) => section.kind)).toEqual([
      'singleChoice',
      'multipleChoice',
      'blank',
      'problem',
    ]);
    expect(document.sections.map((section) => section.summaryMode)).toEqual([
      'questionCountAndPoints',
      'questionCountAndPoints',
      'questionCountAndPoints',
      'questionCountAndPoints',
    ]);
    expect(document.frontMatter.informationFields).toContainEqual({
      label: '考号：',
      kind: 'squares',
      length: 8,
    });
    expect(questions).toHaveLength(19);
    expect(calculateDocumentStats(document)).toMatchObject({
      questionCount: 19,
      totalPoints: 150,
    });
    expect(questions.reduce((count, question) => count + (question.choices?.length ?? 0), 0)).toBe(
      44,
    );
    expect(
      questions.reduce(
        (count, question) => count + (question.subQuestionGroup?.items.length ?? 0),
        0,
      ),
    ).toBe(12);
  });

  it('keeps every answer, score scheme, and teacher reference internally complete', () => {
    const document = createFullExam();
    const questions = getQuestions(document);

    for (const question of questions) {
      expect(question.solution?.length, question.id).toBeGreaterThan(0);
      expect(reviewQuestionScoreMarks(question), question.id).toEqual([]);

      if (question.type === 'singleChoice' || question.type === 'multipleChoice') {
        const optionIds = new Set(question.choices?.map((choice) => choice.id));
        expect(question.correctChoiceIds?.length, question.id).toBeGreaterThan(0);
        expect(
          question.correctChoiceIds?.every((answerId) => optionIds.has(answerId)),
          question.id,
        ).toBe(true);
      }

      if (question.type === 'blank') {
        expect(
          question.blanks?.every((blank) => (blank.answer?.length ?? 0) > 0),
          question.id,
        ).toBe(true);
      }

      for (const subQuestion of question.subQuestionGroup?.items ?? []) {
        expect(subQuestion.solution?.length, subQuestion.id).toBeGreaterThan(0);
        expect(subQuestion.scoreMarks?.length, subQuestion.id).toBeGreaterThan(0);
        expect(subQuestion.scoreMode, subQuestion.id).toBeDefined();
        expectTeacherReferencesToResolve(subQuestion);
      }

      if ((question.scoreMarks?.length ?? 0) > 0) {
        expect(question.scoreMode, question.id).toBeDefined();
      }

      expectTeacherReferencesToResolve(question);
    }

    const finalProblem = questions.at(-1)!;
    const ellipseFinalSubQuestion = questions.at(-2)?.subQuestionGroup?.items.at(-1);
    const finalSubQuestion = finalProblem.subQuestionGroup?.items.at(-1);
    expect(ellipseFinalSubQuestion?.scoreMode).toBe('additive');
    expect(ellipseFinalSubQuestion?.scoreMarks?.map((mark) => mark.points)).toEqual([2, 4]);
    expect(finalSubQuestion?.scoreMode).toBe('levels');
    expect(finalSubQuestion?.scoreMarks?.map((mark) => mark.points)).toEqual([6, 3, 0]);

    const inlineOwners = getTeacherContentOwners(document).filter((owner) =>
      owner.scoreMarks?.some((mark) => mark.placement === 'inline'),
    );
    const annotationOwners = getTeacherContentOwners(document).filter(
      (owner) => (owner.solutionAnnotations?.length ?? 0) > 0,
    );
    expect(inlineOwners).toHaveLength(1);
    expect(annotationOwners).toHaveLength(1);
  });

  it('exports clean student and teacher variants without a long TeX snapshot', () => {
    const teacherDocument = createFullExam();
    const studentDocument = structuredClone(teacherDocument);
    studentDocument.setup.answerMode = 'student';

    const student = exportExamDocumentToTex(studentDocument, { includeAppMetadata: false });
    const teacher = exportExamDocumentToTex(teacherDocument, { includeAppMetadata: false });

    expect(student.diagnostics).toEqual([]);
    expect(teacher.diagnostics).toEqual([]);
    expect(countOccurrences(teacher.tex, '\\begin{question}')).toBe(14);
    expect(countOccurrences(teacher.tex, '\\begin{problem}')).toBe(5);
    expect(teacher.tex.indexOf('已知集合')).toBeLessThan(teacher.tex.indexOf('已知函数'));
    expect(teacher.tex).toContain('solution/show-solution = show-stay');
    expect(teacher.tex).toContain('paren/text-color = red');
    expect(teacher.tex).toContain('fillin/text-color = red');
    expect(student.tex).not.toContain('fillin/text-color');
    expect(teacher.tex).toContain('\\examsquare{8}');
    expect(teacher.tex).toContain('\\section{选择题：本题共 8 小题，每小题 5 分，共 40 分。}');
    expect(teacher.tex).toContain('\\dfrac');
    expect(teacher.tex).toContain('\\left[E(X)\\right]');
    expect(teacher.tex).toContain('\\left(n+1\\right)');
    expect(teacher.tex).toContain('需同时取上、下两个交点');
    expect(teacher.tex).toContain('\\score{4}');
    expect(student.tex).toContain('solution/show-solution = hide');
    expect(student.tex).not.toContain('\\begin{solution}');
    expect(student.tex).not.toContain('\\score{');
    expect(student.tex).not.toContain('需同时取上、下两个交点');
  });
});

function createFullExam(): ExamDocument {
  return createExamDocumentFromTemplate('math-full-exam', sequenceIdFactory());
}

function sequenceIdFactory(): CreateId {
  let index = 0;
  return (prefix) => `${prefix}-${++index}`;
}

function getQuestions(document: ExamDocument): ExamQuestion[] {
  return document.sections.flatMap((section) => section.questions);
}

function getTeacherContentOwners(document: ExamDocument): Array<ExamQuestion | SubQuestion> {
  return getQuestions(document).flatMap((question) => [
    question,
    ...(question.subQuestionGroup?.items ?? []),
  ]);
}

function expectTeacherReferencesToResolve(owner: ExamQuestion | SubQuestion): void {
  const scoreIds = new Set(owner.scoreMarks?.map((scoreMark) => scoreMark.id));
  const annotationIds = new Set(owner.solutionAnnotations?.map((annotation) => annotation.id));
  const scoreRefs = collectScoreReferenceIds(owner.solution);
  const annotationRefs = collectAnnotationReferenceIds(owner.solution);

  expect(new Set(scoreRefs).size, `${owner.id} score refs`).toBe(scoreRefs.length);
  expect(new Set(annotationRefs).size, `${owner.id} annotation refs`).toBe(annotationRefs.length);
  expect(
    scoreRefs.every((scoreId) => scoreIds.has(scoreId)),
    owner.id,
  ).toBe(true);
  expect(
    annotationRefs.every((annotationId) => annotationIds.has(annotationId)),
    owner.id,
  ).toBe(true);
}

function countOccurrences(input: string, search: string): number {
  return input.split(search).length - 1;
}
